import { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
export const authOptions: NextAuthOptions = {
    pages: {
        signIn: `/login`,
        signOut:`/login`
    },
    session: {
        strategy: 'jwt'
    },
    providers: [
        Credentials({
            name: "Credential",
            credentials: {
                username: {
                    label: "Username: ",
                    type: "text",
                    placeholder: "Admin Username"
                },
                password: {
                    label: "Password: ",
                    type: "password",
                    placeholder: "Password"
                }
            },
            async authorize(credentials) {
                const user = { 
                    id: process.env.ADMIN_USERID, 
                    name: process.env.ADMIN_USERNAME, 
                    password: process.env.ADMIN_PASSWORD
                }
                if (credentials?.username === user.name && credentials?.password === user.password) {
                    return user
                }
                else{
                    return null
                }
            }
        })
    ],
    callbacks: {
        jwt({ token, user }) {
          if (user) {
            return { ...token, id: user.id, username: user.name }; // Save id to token as docs says: https://next-auth.js.org/configuration/callbacks
          }
          return token;
        },
        session: ({ session, token, user }) => {
          return {
            ...session,
            user: {
              ...session.user,
              // id: user.id, // This is copied from official docs which find user is undefined
              id: token.id, // Get id from token instead
            },
          };
        },
      },
}