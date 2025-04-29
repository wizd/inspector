import { useEffect, useRef } from "react";
import { InspectorOAuthClientProvider } from "../lib/auth";
import { SESSION_KEYS } from "../lib/constants";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { useToast } from "@/hooks/use-toast.ts";
import {
  generateOAuthErrorDescription,
  parseOAuthCallbackParams,
} from "@/utils/oauthUtils.ts";

interface OAuthCallbackProps {
  onConnect: (serverUrl: string) => void;
}

const OAuthDebugCallback = ({ onConnect }: OAuthCallbackProps) => {
  const { toast } = useToast();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Skip if we've already processed this callback
      if (hasProcessedRef.current) {
        return;
      }
      hasProcessedRef.current = true;

      onConnect("");

      const notifyError = (description: string) =>
        void toast({
          title: "OAuth Authorization Error",
          description,
          variant: "destructive",
        });

      const params = parseOAuthCallbackParams(window.location.search);
      if (!params.successful) {
        return notifyError(generateOAuthErrorDescription(params));
      }

      const serverUrl = sessionStorage.getItem(SESSION_KEYS.SERVER_URL);
      if (!serverUrl) {
        return notifyError("Missing Server URL [DEBUG]");
      }

      onConnect(serverUrl);

      if (!params.code) {
        return notifyError("Missing authorization code");
      }

      sessionStorage.setItem(SESSION_KEYS.DEBUG_CODE, params.code);

      // let result;
      // try {
      //   // Create an auth provider with the current server URL
      //   const serverAuthProvider = new InspectorOAuthClientProvider(serverUrl);

      //   result = await auth(serverAuthProvider, {
      //     serverUrl,
      //     authorizationCode: params.code,
      //   });
      // } catch (error) {
      //   console.error("OAuth callback error:", error);
      //   return notifyError(`Unexpected error occurred: ${error}`);
      // }

      // if (result !== "AUTHORIZED") {
      //   return notifyError(
      //     `Expected to be authorized after providing auth code, got: ${result}`,
      //   );
      // }

      // Finally, trigger auto-connect
      toast({
        title: "Success",
        description: "Successfully authenticated with OAuth",
        variant: "default",
      });
      onConnect(serverUrl);
    };

    handleCallback().finally(() => {
      // Only redirect if we have the URL set, otherwise assume it was in a new tab.
      if (sessionStorage.getItem(SESSION_KEYS.SERVER_URL)) {
        window.history.replaceState({}, document.title, "/");
      }
    });
  }, [toast, onConnect]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="mt-4 p-4 bg-secondary rounded-md max-w-md">
        <p className="mb-2 text-sm">
          Please copy this authorization code and return to the Auth Debugger:
        </p>
        <code className="block p-2 bg-muted rounded-sm overflow-x-auto text-xs">
          {parseOAuthCallbackParams(window.location.search).code ||
            "No code found"}
        </code>
        <p className="mt-4 text-xs text-muted-foreground">
          Close this tab and paste the code in the OAuth flow to complete
          authentication.
        </p>
      </div>
    </div>
  );
};

export default OAuthDebugCallback;
