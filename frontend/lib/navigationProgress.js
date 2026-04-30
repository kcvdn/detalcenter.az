import NProgress from "nprogress";

export function startNavigationProgress() {
  if (typeof window === "undefined") {
    return;
  }

  NProgress.start();
}

export function stopNavigationProgress() {
  if (typeof window === "undefined") {
    return;
  }

  NProgress.done();
}

export function navigateWithProgress(router, href, method = "push") {
  if (!router || typeof router[method] !== "function") {
    return;
  }

  startNavigationProgress();
  router[method](href);
}
