export const lovable = {
 auth: {
   signInWithOAuth: async () => ({
     error: new Error("Lovable cloud auth disabled for Azure deployment"),
     redirected: false,
   }),
 },
};
export default lovable;
