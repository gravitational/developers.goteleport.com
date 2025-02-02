---
title: RFD 72 - Import EC2 Instance Tags
description: RFD 72 describes that enables Teleport nodes running on EC2 instances automatically add instance tags as labels.
h1: RFD 72 - Import EC2 Instance Tags
authors: Andrew Burke (andrew.burke@goteleport.com)
state: implemented
---


Implemented in Teleport 9.3.4+ and 10.0.0+. See the [documentation](https://goteleport.com/docs/setup/guides/ec2-tags/) for details.

### Related issues

- [#11627](https://github.com/gravitational/teleport/issues/11627)

## Why

The current recommended method of [using EC2 tags as Teleport labels](https://goteleport.com/docs/setup/guides/ec2-tags/) requires
- Creating a custom script to fetch the tags
- Individually adding each tag as a dynamic label
- Using the AWS API gateway, where the cost scales with the number of nodes using it

As of January 2022, [instance tags are available via the instance metadata service](https://aws.amazon.com/about-aws/whats-new/2022/01/instance-tags-amazon-ec2-instance-metadata-service/). This will allow Teleport nodes to discover their own instance tags. Unlike the AWS API gateway, instance metadata requests are free and per-instance.

## Details

EC2 tags will be supported everywhere that dynamic labels are currently supported (i.e. SSH, Kube, Apps, and Databases). Each agent will be assigned the same labels (so for instance, if a database agent has multiple databases, all of the databases will have the same labels from EC2).

When a Teleport process running an SSH or other service is started, check if it is running in an EC2 instance. If it is, fetch all tags from the instance metadata service and add them as labels to Teleport, then start a service that periodically (every hour) that does the same. Updates will replace all labels from the previous iteration, so newly created or deleted tags will be reflected in Teleport.

EC2 labels will use the `aws` prefix in Teleport for namespacing (similar to `teleport.dev`). For example, if the instance has the tag `Name: my-instance`, Teleport will add the label `aws/Name: my-instance`. Ideally, the `aws` namespace will prevent collisions with static and command label names, but if there is a collision, EC2 labels will not override static or command labels.

In order to use this feature, instance tags in metadata must be enabled for the instance. Instance tags in metadata can be enabled/disabled when launching a new instance; they can also be toggled for an existing instance via `Actions > Instance settings > Allow tags in instance metadata` in the management console or with the `modify-instance-metadata-options` command in the AWS CLI. See the [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Tags.html#allow-access-to-tags-in-IMDS) for more details.

Note: Some instance types (specifically non-[Nitro](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html#ec2-nitro-instances)) [do not propagate tag updates until after a restart](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Tags.html#work-with-tags-in-IMDS). This will need to be mentioned in the documentation.

### Throttling
AWS applies [per-instance throttling to instance metadata requests](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html#instancedata-throttling). Each instance can have at most 50 tags, so with one request to fetch all tag keys and up to 50 requests to fetch tag values, Teleport only needs to make at most 51 instance metadata requests per hour, which should not have throttling issues.

### Special Tags

#### `TeleportHostname`

When a Teleport process is created, it will check if it is running in an EC2 instance. If it is, and the instance has the tag `TeleportHostname` with a nonempty value, the process will use that value as the node's hostname, overriding the hostname provided in the config.
