export function generateVerificationEmail(otp: string, verificationLink: string): string {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table
              width="100%"
              style="
                max-width: 600px;
                background-color: #ffffff;
                border: 1px solid #000;
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                padding: 30px;
                text-align: center;
              "
            >
              <tr>
                <td style="font-size: 24px; font-weight: bold; color: #000;">
                  ${otp}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 0; font-size: 16px; color: #333;">
                  Klik op de onderstaande knop om je registratie te voltooien.
                </td>
              </tr>
              <tr>
                <td>
                  <a
                    href="${verificationLink}"
                    style="
                      display: inline-block;
                      padding: 12px 24px;
                      background-color: #000;
                      color: white;
                      text-decoration: none;
                      font-weight: bold;
                      border-radius: 8px;
                      font-size: 16px;
                      margin-top: 10px;
                    "
                  >
                    Creëer account
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 30px; font-size: 12px; color: #999;">
                  Als je je niet hebt geregistreerd, kun je deze e-mail negeren.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}