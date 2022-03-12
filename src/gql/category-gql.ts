import { gql } from "@apollo/client"

export const CATEGORIES_QUERY = gql`
    query categories($input: CategoriesInput!) {
        categories(input: $input) {
            ok
            error
            categories {
                id
                name
                slug
            }
        }
    }
`
