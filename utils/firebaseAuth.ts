let nativeAuth: any = null;
try {
  const fbAuthModule = require("@react-native-firebase/auth");
  nativeAuth = fbAuthModule.default || fbAuthModule;
} catch (e) {
  console.log("Firebase Auth native module not loaded on mobile:", e);
}

export const signInWithPhoneNumber = async (phoneNumber: string) => {
  if (!nativeAuth) {
    throw new Error("Native Firebase Auth module not linked or compiled.");
  }
  return await nativeAuth().signInWithPhoneNumber(phoneNumber);
};
