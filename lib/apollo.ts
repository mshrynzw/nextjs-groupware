import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

const httpLink = new HttpLink({
  uri : `${API_URL}/graphql`
})

const authLink = setContext((_, { headers }) => {
  const token = Cookies.get("token")
  return {
    headers : {
      ...headers,
      Authorization : token ? `Bearer ${token}` : ""
    }
  }
})

const client = new ApolloClient({
  link : authLink.concat(httpLink),
  cache : new InMemoryCache()
})

export default client