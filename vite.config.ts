// @ts-nocheck
import type { UserConfig, ViteDevServer } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

const root = process.cwd();

function pathResolve(dir: string) {
  return resolve(root, ".", dir);
}

// 多页面信息
const mutltiPages = [
  { name: "releases", htmlName: "index.html", htmlPath: "src/inner-pages/releases/", outPagePath: "inner-pages/releases/" },
  { name: "about", htmlName: "index.html", htmlPath: "pages/about/", outPagePath: "pages/about/" },
  { name: "agreement", htmlName: "index.html", htmlPath: "pages/agreement/", outPagePath: "pages/agreement/" },
];

// 所有页面
const pages = [{ name: "index", htmlName: "index.html", htmlPath: "", outPagePath: "" }, ...mutltiPages];

pages.forEach((page) => {
  page.path = pathResolve(page.htmlPath + page.htmlName);
});

// server插件
const multiplePagePlugin = () => ({
  name: "multiple-page-plugin",
  configureServer(server: ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      for (let page of pages) {
        if (page.name === "index") {
          continue;
        }

        if (req.url.startsWith(`/${page.name}`)) {
          req.url = `/${page.htmlPath}${page.htmlName}`;
          break;
        }
      }
      next();
    });
  },
});

// 处理html输出路径
const htmlPlugin = () => {
  return {
    name: "html-path-manual",
    generateBundle(options, bundle) {
      // 对inner-pages下的index.html的输出路径单独进行处理
      const innerPages = mutltiPages.filter((page) => page.outPagePath.startsWith("inner-pages"));
      for (let page of innerPages) {
        const htmlFile = bundle[page.htmlPath + page.htmlName];
        if (htmlFile) {
          htmlFile.fileName = page.outPagePath + page.htmlName;
        }
      }
    },
  };
};

export default (): UserConfig => {
  return {
    plugins: [vue(), multiplePagePlugin()],
    build: {
      rollupOptions: {
        input: pages.reduce((res: Record<string, string>, cur) => {
          res[cur.name] = cur.path;
          return res;
        }, {}),
        output: {
          // 自定义输出目录和文件名
          entryFileNames: (chunkInfo) => {
            // 尝试通过chunk名匹配多页面路径 若匹配到则放置在对应目录 否则放置在根目录
            const page = mutltiPages.find((p) => p.name === chunkInfo.name);
            return page ? `${page.outPagePath.replace(/^\//, "")}assets/[name].[hash].js` : "assets/[name].[hash].js";
          },
          chunkFileNames: (chunkInfo) => {
            // 通过chunk的facadeModuleId匹配多页面路径
            if (chunkInfo.facadeModuleId) {
              const chunk = mutltiPages.find((p) => chunkInfo.facadeModuleId?.includes(p.outPagePath));
              return chunk ? `${chunk.outPagePath.replace(/^\//, "")}assets/[name].[hash].js` : "assets/[name].[hash].js";
            }
            return "assets/[name].[hash].js";
          },
          assetFileNames: (assetInfo) => {
            // 处理 CSS、图片等资源
            // 优先按照原始文件名处理 若匹配到多页面路径则放置在对应目录 否则放置在根目录assets
            if (assetInfo.originalFileName) {
              const page = mutltiPages.find((p) => assetInfo.originalFileName?.includes(p.outPagePath));
              return page ? `${page.outPagePath.replace(/^\//, "")}assets/[name].[hash][extname]` : "assets/[name].[hash][extname]";
            } else {
              // 如果没有原始文件名，通过name匹配
              const page = mutltiPages.find((p) => assetInfo.name?.includes(p.name));
              return page ? `${page.outPagePath.replace(/^\//, "")}assets/[name].[hash][extname]` : "assets/[name].[hash][extname]";
            }
          },
        },
        plugins: [htmlPlugin()],
      },
    },
  };
};
