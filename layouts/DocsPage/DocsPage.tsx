import cn from "classnames";
import { MDXProvider } from "@mdx-js/react";
import { useContext, useEffect } from "react";
import { VarsProvider } from "components/Variables";
import AnchorNavigation, { HeaderMeta } from "components/AnchorNavigation";
import Button from "components/Button";
import Head from "components/Head";
import SiteHeader from "components/Header";
import Link, { useCurrentHref } from "components/Link";
import Notice from "components/Notice";
import VideoBar from "components/VideoBar";
import { VarList } from "components/Variables";
import { useFindDestinationPath } from "utils/useFindDestinationPath";
import { components } from "./components";
import { DocsContext } from "./context";
import Header from "./Header";
import Footer from "./Footer";
import Navigation, { getCurrentCategoryIndex } from "./Navigation";
import type { PageMeta } from "./types";

import styles from "./DocsPage.module.css";

interface DocsPageProps {
  meta: PageMeta;
  tableOfConents: HeaderMeta[];
  children: React.ReactNode;
}

const DocsPage = ({
  meta: {
    h1,
    title,
    description,
    layout,
    videoBanner,
    navigation,
    versions,
    githubUrl,
    scopes,
  },
  tableOfConents,
  children,
}: DocsPageProps) => {
  const route = useCurrentHref();
  const { setVersions, scope, setScope } = useContext(DocsContext);

  const { current, latest, available } = versions;
  const getPath = useFindDestinationPath(versions);

  useEffect(() => {
    setVersions(versions);

    if (
      scopes[0] !== "" &&
      scopes[0] !== "noScope" &&
      !scopes.includes(scope)
    ) {
      setScope(scopes[0]);
    }
  }, [versions, setVersions, setScope, scopes, scope]);

  const isSectionLayout = layout === "section";
  const isTocVisible = (!layout || layout === "doc") && tableOfConents.length;

  const categoryId = getCurrentCategoryIndex(navigation, route);
  const icon = navigation[categoryId]?.icon || "book";

  const isOldVersion = available.indexOf(current) < available.indexOf(latest);
  const isBetaVersion = available.indexOf(current) > available.indexOf(latest);

  let path = getPath(latest);

  return (
    <>
      <Head
        title={title}
        description={description}
        titleSuffix="Teleport Docs"
      />
      <SiteHeader />
      <main className={styles.wrapper}>
        <div className={styles.navigation}>
          <Navigation
            data={navigation}
            section={isSectionLayout}
            currentVersion={current}
          />
        </div>
        <div className={styles.body}>
          <Header
            title={h1 || title}
            description={description}
            versions={versions}
            githubUrl={githubUrl}
            icon={icon}
            getNewVersionPath={getPath}
            latest={latest}
            scopes={scopes}
          />
          {/* {videoBanner && (
            <VideoBar className={styles.video} {...videoBanner} />
          )} */}
          <div className={cn(styles["main-wrapper"], styles[layout])}>
            <div className={styles.main}>
              {/* {(isOldVersion || isBetaVersion) && (
                <Notice type="danger" className={styles.notice}>
                  {isOldVersion && (
                    <>
                      This chapter covers a past release: {current}. We
                      recommend the <Link href={`/docs${path}`}>latest</Link>{" "}
                      version instead.
                    </>
                  )}
                  {isBetaVersion && (
                    <>
                      This chapter covers an upcoming release: {current}. We
                      recommend the <Link href={`${path}`}>latest</Link> version
                      instead.
                    </>
                  )}
                </Notice>
              )} */}
              <VarsProvider>
                <VarList />
                <div className={cn(styles.text, styles[layout])}>
                  <MDXProvider components={components}>{children}</MDXProvider>
                </div>
              </VarsProvider>
            </div>
            {isTocVisible && (
              <AnchorNavigation
                headers={tableOfConents}
                className={styles["anchor-navigation"]}
              />
            )}
          </div>
          <Footer section={isSectionLayout}>
            <div className={styles.footer}>
              Have a suggestion or can’t find something?
            </div>
            <Button
              as="link"
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              shape="lg"
              variant="secondary"
            >
              IMPROVE THE DOCS
            </Button>
          </Footer>
        </div>
      </main>
    </>
  );
};

export default DocsPage;
