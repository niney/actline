/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CategoriesInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: categories
// ====================================================

export interface categories_categories_categories {
  __typename: "Category";
  id: number;
  name: string;
  slug: string;
}

export interface categories_categories {
  __typename: "CategoriesOutput";
  ok: boolean;
  error: string | null;
  categories: categories_categories_categories[] | null;
}

export interface categories {
  categories: categories_categories;
}

export interface categoriesVariables {
  input: CategoriesInput;
}
