import { MenuCategoryProps } from "./Category";

const menu: MenuCategoryProps[] = [
  {
    title: "API Reference",
    description: "API Reference",
    href: "/docs/api-reference/",
  },
  {
    title: "RFDs",
    description: "Teleport RFD",
    href: "/docs/rfd/",
  },
  {
    title: "Go Client",
    description: "Build a Go client to implement Teleport API",
    href: "/docs/go-client",
  },
  {
    title: "Support",
    description: "Teleport documentation",
    href: "/docs/",
    children: [
      {
        icon: "question",
        title: "Community Forum",
        description:
          "Ask us a setup question, post your tutorial, feedback or idea on our forum",
        href: "https://github.com/gravitational/teleport/discussions",
      },
      {
        icon: "window",
        title: "Teleport Slack Channel",
        description: "Need help with set-up? Ping us in Slack channel",
        href: "/slack",
      },
      {
        icon: "code",
        title: "Github",
        description: "View the open source repository on Github",
        href: "https://github.com/gravitational/teleport",
      },
    ],
  },
];

export default menu;
