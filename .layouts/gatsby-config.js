const path = require("path");
const pathPrefix = "/";
// Change me
const siteMetadata = {
  title: "Mars’ Blog",
  shortName: "Mars’ Blog | 记录·分享·回顾",
  description: "自我提升,效率提升,开源工具,学习笔记,网络安全",
  twitterName: "theowenyoung",
  imageUrl: "/graph-visualisation.jpg",
  siteUrl: "https://mars.run",
};
module.exports = {
  siteMetadata,
  pathPrefix,
  flags: {
    DEV_SSR: true,
  },
  plugins: [
    {
      resolve: "gatsby-theme-primer-wiki",
      // Change me
      options: {
        icon: "./static/logo.png",
        sidebarComponents: ["latest", "category", "tag"],
        nav: [
          {
            title: "RSS信息流",
            url: "https://mars0run.notion.site/5ccdf71345c2440da2ccd385e98dd71d?v=edfc490b781d435ba1e066a4d1b2dd48",
          },
          {
            title: "RedBlue",
            url: "https://redblue.wiki/",
          },
        ],
        editUrl:
          "https://github.com/MarsAuthority/Blog/tree/main/",
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "content",
        path: `${__dirname}/..`,
        ignore: [`**/\.*/**/*`],
      },
    },

    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: siteMetadata.title,
        short_name: siteMetadata.shortName,
        start_url: pathPrefix,
        background_color: `#f7f0eb`,
        display: `standalone`,
        icon: path.resolve(__dirname, "./static/logo.png"),
      },
    },
    {
      resolve: `gatsby-plugin-sitemap`,
    },
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        host: siteMetadata.siteUrl,
        sitemap: `${siteMetadata.siteUrl}/sitemap/sitemap-index.xml`,
        policy: [{ userAgent: "*", allow: "/" }],
      },
    },
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        // You can add multiple tracking ids and a pageview event will be fired for all of them.
        trackingIds: [],
      },
    },
  ],
};
