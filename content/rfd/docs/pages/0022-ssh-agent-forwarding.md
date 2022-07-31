---
title: RFD 22 - SSH key agent forwarding
description: This RFD proposes design changes to make tsh agent forwarding compatible with OpenSSH agent forwarding.
h1: RFD 22 - SSH key agent forwarding
authors: Trent Clarke (trent@goteleport.com)
state: draft
---

Issue [#1517](https://github.com/gravitational/teleport/issues/1517) draws
attention to the behaviour of `tsh ssh` differing from the behaviour of the
stock OpenSSH `ssh` client when forwarding a Key Agent to the remote machine.

This is a proposal to change `tsh ssh`'s agent-forwarding behaviour to match
that of the OpenSSH client, while also allowing the legacy `tsh` behaviour if
necessary.

## Why

### Background: What is Key Agent Forwarding?

An SSH Key Agent is a service that brokers access to keys, used by an SSH client
when authenticating against a remote machine.

The OpenSSH remote login client allows a user to _forward_ their key agent to
the remote server via a secondary channel in the ssh protocol. This makes the Key
Agent on the user's local machine available on the remote server, and allowing the
user to connect to a _third_ machine from the remote server and authenticate
with keys stored on the user's local machine.

```
             Overly Simplified Authentication Flow with Forwarded Key Agent

   ┌─────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────────┐
   │Key Agent│          │Local Machine│          │Remote Machine│          │Third Machine│
   └────┬────┘          └──────┬──────┘          └──────┬───────┘          └──────┬──────┘
        │                      │      SSH Connect       │                         │
        │                      │───────────────────────>│                         │
        │                      │    Auth challenge      │                         │
        │                      │<───────────────────────│                         │
        │   Auth Challenge     │                        │                         │
        │<─────────────────────│                        │                         │
        │   Signed Response    │                        │                         │
        │─────────────────────>│                        │                         │
        │                      │    Signed Response     │                         │
        │                      │───────────────────────>│                         │
        │              ╔═══════╧════════════════════════╧════════╗                │
        │              ║       Authentication established        ║                │
        │              ╚═══════╤════════════════════════╤════════╝                │
        │                      │               ╔════════╧═════════╗               │
        │                      │               ║ User connects to ║               │
        │                      │               ║ "Third Machine"  ║               │
        │                      │               ╚════════╤═════════╝               │
        │                      │                        │       SSH Connect       │
        │                      │                        │ ───────────────────────>│
        │                      │                        │     Auth challenge      │
        │                      │                        │ <───────────────────────│
        │  Auth Challenge (via forwarded connection)    │                         │
        │<──────────────────────────────────────────────│                         │
        │  Signed Response (via forwarded connection)   │                         │
        │──────────────────────────────────────────────>│                         │
        │                      │                        │     Signed Response     │
        │                      │                        │ ───────────────────────>│
        │                      │                ╔═══════╧═════════════════════════╧═══════╗
        │                      │                ║       Authentication established        ║
        |                      |                ╚═════════════════════════════════════════╝
   ┌────┴────┐          ┌──────┴──────┐          ┌──────┴───────┐          ┌──────┴──────┐
   │Key Agent│          │Local Machine│          │Remote Machine│          │Third Machine│
   └─────────┘          └─────────────┘          └──────────────┘          └─────────────┘
```

The above diagram leaves out a _lot_ of detail, but the overall process should be clear
enough for this discussion.

### What's the issue?

An OpenSSH user can forward their Key Agent to the remote machine using the `-A` flag on
the `ssh` command line. This allows the user to use arbitrary keys stored on their _local_
machine to authenticate against a "Third Machine" from inside their session on the Remote
Machine.

When running `tsh ssh`, a user may have _two_ independent key agents running: their own
(which we will call the _System Key Agent_), and an ephemeral one inside the `tsh` process
itself (the _Teleport Key Agent_). The Teleport Key Agent is populated with the contents
of the user's `.tsh` directory.

The `tsh ssh` client _also_ offers a `-A` option to forward a Key Agent to the Remote
Machine, but it will only ever forward the Teleport Key Agent, not the System Key Agent.
This is surprising behaviour to a user accustomed to OpenSSH. The user finds that keys
they expected to be available to them in the session on the Remote Machine are not
available.

The tricky part is that _both_ of these behaviours are sensible, depending on the user's
expectations. Any solution will have to accommodate both behaviours.

## Details

### Proposed Solution

**NB:** This proposal is strictly about how a Key Agent is forwarded to a remote 
machine by `tsh ssh`. It does _not_ change how `tsh` authenticates against a `teleport`
auth service.

Behind the scenes, both the OpenSSH client & `tsh ssh` treat the `-A` flag as shorthand
for setting the SSH config value `ForwardAgent` to `yes`.

Looking at the `man` page for `ssh_config(5)`, we can see the definitive list of values
that `ForwardAgent` can take, and their meaning:

> **ForwardAgent**
>
>   Specifies whether the connection to the authentication agent (if any) will be forwarded
>   to the remote machine.  The argument may be `yes`, `no` (the default), an explicit path 
>   to an agent socket or the name of an environment variable (beginning with ‘$’) in which 
>   to find the path.

The `tsh ssh` client already supports the `yes` and `no` options, where `yes` means
forwarding the Teleport Key Agent. To allow the user to forward their own Key Agent, _and_
to bring `tsh ssh`'s behaviour more in line with the OpenSSH client, I propose the following
values be allowed for the `ForwardAgent`option:


| Value          | Interpretation                                           |
|----------------|----------------------------------------------------------|
| `no` (default) | `tsh ssh` will not forward _any_ Key Agent               |
| `yes`          | `tsh ssh` will forward the System Key Agent (if present) |
| `local`        | `tsh ssh` will forward the Teleport Key Agent            |


* The value `yes` is redefined to refer to the System Key Agent instead of
  the Teleport Key Agent.

* The value `local` is a `tsh`-specific extension that will activate the
  backwards-compatible behaviour.

The effect of this change is that the `tsh ssh` option `-A` will automatically acquire
semantics in line with the OpenSSH client, while the backwards compatible behaviour can be
activated with something like:

```bash
$ tsh ssh -o "ForwardAgent local" root@example.com
```

### Backwards compatibility breakage

This change introduces a backwards compatibility breakage, albeit a very small one. It _does_
provide an escape hatch back to legacy behaviour, but using the legacy behaviour requires 
action from the user.

### Precedence

If both `-A` and `-o "ForwardAgent $VALUE"` are specified together on the same command line, `-A`
will take precedence. This is consistent with the existing behaviour of `tsh ssh`, where a
command line like...
```bash
$ tsh ssh -A -o "ForwardAgent no" root@example.com
```
...would result in the Key Agent being forwarded.


### No System Key Agent

If no System Key Agent is running and the user specifies `-A` and/or `-o "ForwardAgent yes"`, 
then `tsh ssh` will NOT forward an Key Agent to the remote machine, consistent with the 
behaviour of OpenSSH.

## Out of scope

Adding support for indicating an arbitrary Key Agent to forward (by passing the path to a unix
domain socket, or an environment variable containing the same) as per `man ssh_config(5)` is
not being considered here. My only concern in that direction has been to avoid making it harder
to implement later, if it's ever required.

## Appendices

### PlantUML source

```PlantUML
@startuml

title "Overly Simplified Authentication Flow"

participant "Key Agent"
participant "Local Machine"
participant "Remote Machine"
participant "Third Machine"

"Local Machine" -> "Remote Machine" : SSH Connect
"Remote Machine" -> "Local Machine" : Auth challenge
"Local Machine" -> "Key Agent" : Sign Challenge
"Key Agent" -> "Local Machine": Signed Response
"Local Machine" -> "Remote Machine" : Signed Response

note over "Local Machine", "Remote Machine": Authentication established

note over "Remote Machine": User connects to\n"Third Machine"
"Remote Machine" -> "Third Machine" : SSH Connect
"Third Machine" -> "Remote Machine" : Auth challenge
"Remote Machine" -> "Key Agent" : Sign Challenge (via forwarded connection)
"Key Agent" -> "Remote Machine": Signed Response (via forwarded connection)
"Remote Machine" -> "Third Machine" : Signed Response

note over "Remote Machine", "Third Machine": Authentication established
@enduml
```