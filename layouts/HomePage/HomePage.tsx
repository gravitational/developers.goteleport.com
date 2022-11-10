import Head from "components/Head";
import SiteHeader from "components/Header";
import styles from "./HomePage.module.css";
import NextImage from "next/image";
import Button from "components/Button";
import PAM from "layouts/HomePage/assets/pam.png";

const HomePage = ({}: any) => {
  return (
    <>
      <Head
        title={"Automate Access Control With Teleport"}
        description={"Docs, tutorials and developer projects."}
        titleSuffix="Teleport Develepers Site"
      />
      <SiteHeader />
      <main className={styles.wrapper}>
        <div className={styles.body}>
          <div className={styles.mainWrapper}>
            <div className={styles.main}>
              <h1 className={styles.title}>Teleport Developers</h1>
              <p className={styles.subtitle}>
                Automate configuration, access policies, JIT access, and
                integrate with security tools with Teleport API.
              </p>
              <Button as="link" href="/docs/api-client/">
                Get Started
              </Button>
            </div>
          </div>
          <div className={styles.image}>
            <NextImage
              width={500}
              height={450}
              layout="intrinsic"
              src={PAM}
              alt="PAM developer"
            />
          </div>
        </div>
      </main>
      <div className={styles.footer}>
        © 2022 Gravitational Inc.; all rights reserved.
      </div>
    </>
  );
};

export default HomePage;
