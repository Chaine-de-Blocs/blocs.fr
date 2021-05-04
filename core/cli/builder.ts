import chalk from "chalk";
import fs from "fs";

import renderPage from "../renderPage";
import { createContentContext } from '../useContent';
import { File, getPages, getPosts } from "../files";
import { clearFileCache } from "../cacheTransform";
import { resetCssStats, validateCss } from "../css";

import RSS from "feed";

const pages = getPages();
const posts = getPosts();

const files = new Set([...pages, ...posts]);
const fileDependencies = new Map<File, Set<string>>();

const run = (files: Set<File>, message: string) => {
  const start = Date.now();
  console.log(chalk.dim(`[${message}...]`));

  files.forEach((file) => {
    console.log(`- Building ${file.title ?? file.url}`);
    const { dependencies } = renderPage(file);

    fileDependencies.set(file, dependencies);
  });

  const page = pages[0];

  if (page) {
    const host = fs.readFileSync('CNAME', 'utf8');

    const baseURL = 'https://' + host + '/';

    const feed = new RSS.Feed({
      title: page.title || '',
      description: page.description || '',
      id: page.url,
      link: baseURL,
      copyright: 'Blocs 2021',
      author: {
        name: 'Jonathan Serra',
        email: 'jonathan@blocs.fr',
        link: baseURL,
      }
    });

    posts.forEach((post) => {
      feed.addItem({
        title: post.title || '',
        link: baseURL + post.url!,
        date: post.date ? new Date(post.date) : new Date(),
        description: post.description || '',
      });
    });

    const content = createContentContext();

    content.write(feed.rss2(), { filename: 'feed', extension: '.xml' });
  }

  const end = Date.now();
  const duration = ((end - start) / 1000).toFixed(2);
  console.log(chalk.green(`[Build completed in ${duration}s]`));
};

const fullBuild = (message: string) => {
  resetCssStats();

  run(files, message);

  const cssStats = validateCss();

  const logIfNotEmpty = (array: string[], message: string) => {
    if (array.length > 0) {
      console.warn(chalk.yellow(message));
      console.warn(array.join(", "));
    }
  };

  logIfNotEmpty(
    cssStats.unusedClassNames,
    "The following classes were defined in CSS, but never used in any non-CSS files:"
  );
  logIfNotEmpty(
    cssStats.undeclaredClassNames,
    "The following classes used one more non-CSS files, but never defined in CSS:"
  );
};

let pendingFiles = new Set<string>();
let rebuildPendingFilesTimeout: ReturnType<typeof setTimeout> | null;

const rebuildPendingFiles = () => {
  const changed = new Set<File>();

  const invertedFileDependencies = new Map<string, Set<File>>();
  fileDependencies.forEach((dependencies, file) => {
    dependencies.forEach((dependency) => {
      let files = invertedFileDependencies.get(dependency);
      if (files == null) {
        files = new Set<File>();
        invertedFileDependencies.set(dependency, files);
      }
      files.add(file);
    });
  });

  pendingFiles.forEach((filename) => {
    clearFileCache(filename);

    invertedFileDependencies.get(filename)?.forEach((file) => {
      changed.add(file);
    });
  });

  pendingFiles.clear();

  if (changed.size > 0) {
    run(changed, "Partial rebuild");
  }
};

process.on("message", (message) => {
  switch (message.type) {
    case "rebuild": {
      pendingFiles.add(message.filename);

      if (rebuildPendingFilesTimeout != null) {
        clearTimeout(rebuildPendingFilesTimeout);
      }
      rebuildPendingFilesTimeout = setTimeout(rebuildPendingFiles, 50);
    }
  }
});

fullBuild("Building site");
