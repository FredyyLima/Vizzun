import { Helmet } from "react-helmet-async";

type SeoHeadProps = {
  title: string;
  description: string;
};

const SITE_NAME = "Vizzun";

const SeoHead = ({ title, description }: SeoHeadProps) => {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
};

export default SeoHead;
