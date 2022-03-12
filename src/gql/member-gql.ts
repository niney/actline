import { gql } from "@apollo/client"

export const LOGIN_MUTATION = gql`
    mutation loginMutation($loginInput: LoginInput!) {
        login(input: $loginInput) {
            ok
            token
            error
        }
    }
`

export const LOGIN_BY_ID_MUTATION = gql`
    mutation loginByIdMutation($loginByIdInput: LoginByIdInput!) {
        loginById(input: $loginByIdInput) {
            ok
            token
            error
        }
    }
`

export const ME_QUERY = gql`
    query meQuery {
        me {
            id
            userId
            name
        }
    }
`

export const CREATE_ACCOUNT_MUTATION = gql`
    mutation createAccountMutation($createAccountInput: CreateAccountInput!) {
        createAccount(input: $createAccountInput) {
            ok
            error
        }
    }
`

// export const UPDATE_ACCOUNT_MUTATION = gql`
//     mutation updateAccountMutation($createAccountInput: CreateAccountInput!) {
//         updateAccount(input: $createAccountInput) {
//             ok
//             error
//         }
//     }
// `
