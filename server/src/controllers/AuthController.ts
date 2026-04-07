import type { Request, Response } from "express";
import axios from "axios";
import { BaseController } from "./BaseController.js";
import type { AuthService } from "../services/AuthService.js";
import { googleAuthSchema } from "../dto/auth.dto.js";

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  clientOrigin: string;
}

export class AuthController extends BaseController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleOAuthConfig,
  ) {
    super();
  }

  googleConnect = (_req: Request, res: Response): void => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", this.google.clientId);
    url.searchParams.set("redirect_uri", this.google.callbackUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    res.redirect(url.toString());
  };

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.query as { code?: string };
    if (!code) {
      res.redirect(`${this.google.clientOrigin}/auth?error=oauth_failed`);
      return;
    }

    const tokenRes = await axios.post<{ access_token: string }>(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: this.google.clientId,
        client_secret: this.google.clientSecret,
        redirect_uri: this.google.callbackUrl,
        grant_type: "authorization_code",
      }),
    );

    const userInfoRes = await axios.get<{ email: string; name: string }>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } },
    );

    const { email, name } = userInfoRes.data;
    const { token } = await this.auth.googleAuth({ name, email });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(this.google.clientOrigin);
  };

  googleAuth = async (req: Request, res: Response): Promise<void> => {
    const dto = googleAuthSchema.parse(req.body);
    const { user, token } = await this.auth.googleAuth(dto);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(user);
  };

  logOut = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie("token");
    res.status(200).json({ message: "LogOut Successfully" });
  };
}
