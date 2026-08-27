import { DocArticle, DocSection } from "../types";
import { gettingStartedArticles } from "./getting-started";
import { conceptsArticles } from "./concepts";
import { sdkArticles } from "./sdk";
import { managedActionsArticles } from "./managed-actions";
import { gatewayApiArticles } from "./gateway-api";
import { advancedArticles } from "./advanced";

export const ALL_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    articles: gettingStartedArticles.map((a) => ({ id: a.id, title: a.title }))
  },
  {
    id: "concepts",
    title: "Concepts",
    articles: conceptsArticles.map((a) => ({ id: a.id, title: a.title }))
  },
  {
    id: "sdk",
    title: "SDK & React",
    articles: sdkArticles.map((a) => ({ id: a.id, title: a.title }))
  },
  {
    id: "managed-actions",
    title: "Managed Actions",
    articles: managedActionsArticles.map((a) => ({ id: a.id, title: a.title }))
  },
  {
    id: "gateway-api",
    title: "Gateway API",
    articles: gatewayApiArticles.map((a) => ({ id: a.id, title: a.title }))
  },
  {
    id: "advanced",
    title: "Advanced & Architecture",
    articles: advancedArticles.map((a) => ({ id: a.id, title: a.title }))
  }
];

export const ALL_ARTICLES: DocArticle[] = [
  ...gettingStartedArticles,
  ...conceptsArticles,
  ...sdkArticles,
  ...managedActionsArticles,
  ...gatewayApiArticles,
  ...advancedArticles
];

export function getArticleById(id: string): DocArticle | undefined {
  return ALL_ARTICLES.find((a) => a.id === id);
}
