export const getEmailSignature = (): string => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const logoUrl = `${baseUrl}/logo.png`;

    return `
    <br />
    <br />
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; color: #333;">
      <tr>
        <td style="padding-right: 15px; vertical-align: middle;">
          <img 
            src="${logoUrl}" 
            alt="Scedexa Logo" 
            width="60" 
            height="60" 
            style="border-radius: 8px; object-fit: contain; display: block;"
          />
        </td>
        <td style="border-left: 2px solid #333; height: 50px; width: 0;"></td>
        <td style="padding-left: 15px; vertical-align: middle;">
          <div style="font-size: 18px; font-weight: bold; color: #0000FF; margin-bottom: 5px; line-height: 1.2;">
            <a href="https://scedexa.com/" style="text-decoration: none; color: #0000FF;">Scedexa</a>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <a href="https://www.linkedin.com/company/scedexa/" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="https://img.icons8.com/color/48/linkedin.png" alt="LinkedIn" width="24" height="24" style="display: block;" />
            </a>
            <a href="https://x.com/scedexa" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="https://img.icons8.com/ios-filled/50/000000/x.png" alt="X" width="24" height="24" style="display: block;" />
            </a>
            <a href="https://www.instagram.com/scedexa_" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="https://img.icons8.com/color/48/instagram-new.png" alt="Instagram" width="24" height="24" style="display: block;" />
            </a>
             <a href="https://www.tiktok.com/@scedexa_" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="https://img.icons8.com/color/48/tiktok--v1.png" alt="TikTok" width="24" height="24" style="display: block;" />
            </a>
          </div>
        </td>
      </tr>
    </table>
  `;
};
