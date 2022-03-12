/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface CategoriesInput {
  parent?: number | null;
  slug?: string | null;
}

export interface CreateAccountInput {
  userId: string;
  password: string;
  name: string;
  phone: string;
}

export interface LoginByIdInput {
  userId: string;
}

export interface LoginInput {
  userId: string;
  password: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
