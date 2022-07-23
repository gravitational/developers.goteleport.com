import cn from "classnames";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dropdown } from "components/Dropdown";
import type { VersionsInfo, VersionsDropdown } from "./types";
import styles from "./Versions.module.css";

// renders strikethrough for deprecated versions
const renderVersion = (version: VersionsDropdown) => {
  if (version.deprecated) return <s>Version {version.value}</s>;

  if (version.value === "Older Versions") return version.value;
  return `Version ${version.value}`;
};

// renders the default box selection
const pickOption = (options: VersionsDropdown[], id: string) =>
  options.find(({ value }) => value === id);

// assigns component key and id props based on the value string
const pickId = ({ value }: VersionsDropdown) => value;

const validVersion = (thisVersion: number, latestVersion: number) => {
  return thisVersion >= latestVersion - 2 ? true : false;
};

// versionaCheck is hardcoded as false to treat all mdx pages as latest version. #devsite
const versionaCheck = false;

const Versions = ({
  current,
  available,
  disabled,
  className,
  getNewVersionPath,
  latest,
}: VersionsInfo) => {
  const router = useRouter();
  const [currentItem, setCurrentItem] = useState<string>(current);

  const latestNumber = Math.floor(Number(latest));

  const versions = useMemo(() => {
    //creates list of versions ultimately from config.json
    const versionNames = [...available].reverse();

    //assigns versions a deprecated status: boolean
    const versionsList = versionNames.map((version) => {
      const versionNumber = Number(version);

      const versionInfo: VersionsDropdown = {
        value: version,
        deprecated: versionaCheck
          ? !validVersion(versionNumber, latestNumber)
          : false,
      };
      return versionInfo;
    });

    //adds an Older Versions element
    versionsList.push({
      value: "Older Versions",
      deprecated: false,
    });

    return versionsList;
  }, [available, latestNumber]);

  // only fires when dropdown selection is changed
  const navigateToVersion = useCallback(
    (option: string) => {
      // if version is deprecated or Older Versions is selected, redirect to /older-versions
      if (!validVersion(Number(option), latestNumber) && versionaCheck) {
        setCurrentItem(option);
        router.push("/older-versions");
        return;
      }

      if (option === "Older Versions") {
        if (versionaCheck) {
          setCurrentItem(option);
          router.push("/older-versions");
        }

        return;
      }

      //otherwise, load selected version
      else {
        let href = getNewVersionPath(option);
        setCurrentItem(option);

        // prevents redirection to different versions of /older-versions/
        if (href.includes("older-versions"))
          href = href.replace("older-versions", "");

        router.push(href);
      }
    },
    [getNewVersionPath, router, latestNumber]
  );

  useEffect(() => {
    setCurrentItem(current);
  }, [current]);

  return (
    <Dropdown
      className={cn(styles.wrapper, className)}
      value={currentItem}
      options={versions}
      disabled={disabled}
      onChange={navigateToVersion}
      renderOption={renderVersion}
      pickOption={pickOption}
      pickId={pickId}
      bgColor="purple"
    />
  );
};

export default Versions;
