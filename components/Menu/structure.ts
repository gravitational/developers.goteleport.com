import { MenuCategoryProps } from "./Category";

const menu: MenuCategoryProps[] = [
  {
    title: "RFDs",
    description: "Teleport RFD",
    href: "/docs/rfd/",
  },
  {
    title: "API Client",
    description: "Build Teleport API client",
    href: "/docs/api-client",
  },
  {
    title: "Support",
    description: "Teleport documentation",
    href: "/docs/",
    children: [
      {
        icon: "question",
        title: "Explore Teleport Community",
        description:
          "Ask us a setup question, post your tutorial, feedback or idea on our forum",
        href: "https://goteleport.com/community",
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
