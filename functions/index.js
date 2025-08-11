/* eslint-disable object-curly-spacing */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

/**
 * Helper to verify that the caller of a function is an admin.
 * @param {object} req The request object from the function call.
 * @throws {HttpsError} Throws if not admin or not authenticated.
 */
const verifyAdmin = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Request had no Authorization header.",
    );
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.role !== "admin") {
      throw new functions.https.HttpsError(
          "permission-denied",
          "User is not an admin.",
      );
    }
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Token is invalid or expired.",
    );
  }
};

exports.createUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await verifyAdmin(req);

      const {email, password, name, role} = req.body.data;
      const newUser = await admin.auth()
          .createUser({email, password, displayName: name});

      await admin.auth().setCustomUserClaims(newUser.uid, {role});
      await admin.firestore().collection("users").doc(newUser.uid).set({
        name, email, role,
      });

      res.status(200).send({data: {uid: newUser.uid, name, email, role}});
    } catch (error) {
      console.error("Error en createUser:", error);
      const status = (error.httpErrorCode && error.httpErrorCode.status) || 500;
      res.status(status).send({error: {message: error.message}});
    }
  });
});

exports.deleteUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await verifyAdmin(req);

      const {uid} = req.body.data;
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection("users").doc(uid).delete();

      res.status(200).send({
        data: {message: "Usuario eliminado correctamente"},
      });
    } catch (error) {
      // ESTE BLOQUE ESTABA INCORRECTO Y AHORA ESTÁ ARREGLADO
      console.error("Error en deleteUser:", error);
      const status = (error.httpErrorCode && error.httpErrorCode.status) || 500;
      res.status(status).send({error: {message: error.message}});
    }
  });
});

exports.updateUserPassword = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await verifyAdmin(req);

      const {uid, password} = req.body.data;
      if (!uid || !password) {
        throw new functions.https.HttpsError(
            "invalid-argument", "Se requiere UID y nueva contraseña.",
        );
      }

      await admin.auth().updateUser(uid, {password: password});

      res.status(200).send({
        data: {message: "Contraseña actualizada correctamente"},
      });
    } catch (error) {
      console.error("Error en updateUserPassword:", error);
      const status = (error.httpErrorCode && error.httpErrorCode.status) || 500;
      res.status(status).send({error: {message: error.message}});
    }
  });
});
