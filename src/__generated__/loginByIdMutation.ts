/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LoginByIdInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: loginByIdMutation
// ====================================================

export interface loginByIdMutation_loginById {
  __typename: "LoginOutput";
  ok: boolean;
  token: string | null;
  error: string | null;
}

export interface loginByIdMutation {
  loginById: loginByIdMutation_loginById;
}

export interface loginByIdMutationVariables {
  loginByIdInput: LoginByIdInput;
}
