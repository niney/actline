import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache, makeVar } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// const token = localStorage.getItem(LOCALSTORAGE_TOKEN)
// let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzgyLCJpYXQiOjE2MzE2NjA5NjF9.uF1QiZgrqAaU5O9drUc8xL15Z18By2vMEisT081sHWM";
let token = "";
export const isLoggedInVar = makeVar(Boolean(token))
export const authTokenVar = makeVar(token)

const httpLink = createHttpLink({
	// uri: "https://api-samplepcbmarket.herokuapp.com/graphql",
	uri: "http://localhost:4000/graphql",
})

const authLink = setContext((_, { headers }) => {
	return {
		headers: {
			...headers,
			authorization: authTokenVar() ? `Bearer ${authTokenVar()}` : "",
		},
	}
})

const client = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache({
		typePolicies: {
			Query: {
				fields: {
					isLoggedIn: {
						read() {
							return isLoggedInVar()
						},
					},
					token: {
						read() {
							return authTokenVar()
						},
					},
				},
			},
		}
	})
});

export default client
