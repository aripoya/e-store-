// Google Drive API integration using Service Account
// This allows uploading files to Google Drive from Cloudflare Workers

interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  folderId?: string;
}

export class GoogleDriveUploader {
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  // Generate JWT token for Google API authentication
  private async getAccessToken(): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: this.config.clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Import private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      this.pemToArrayBuffer(this.config.privateKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Create JWT
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedClaim = this.base64UrlEncode(JSON.stringify(claim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = this.base64UrlEncode(signature);
    const jwt = `${signatureInput}.${encodedSignature}`;

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const data = await response.json();
    return data.access_token;
  }

  // Upload file to Google Drive
  async uploadFile(
    file: ArrayBuffer,
    fileName: string,
    mimeType: string
  ): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const accessToken = await this.getAccessToken();

    // Create metadata
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      ...(this.config.folderId && { parents: [this.config.folderId] }),
    };

    // Create multipart request body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata);
    const filePart =
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      this.arrayBufferToBase64(file);

    const multipartBody = new TextEncoder().encode(metadataPart + filePart + closeDelimiter);

    // Upload to Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Google Drive upload failed: ${error}`);
    }

    const result = await uploadResponse.json();

    // Make file publicly accessible
    await this.makeFilePublic(result.id, accessToken);

    return {
      fileId: result.id,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink || `https://drive.google.com/uc?export=download&id=${result.id}`,
    };
  }

  // Make file publicly accessible
  private async makeFilePublic(fileId: string, accessToken: string): Promise<void> {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  }

  // Helper: Convert PEM to ArrayBuffer
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Helper: Base64 URL encode
  private base64UrlEncode(data: string | ArrayBuffer): string {
    let base64: string;
    if (typeof data === 'string') {
      base64 = btoa(data);
    } else {
      const bytes = new Uint8Array(data);
      const binary = String.fromCharCode(...bytes);
      base64 = btoa(binary);
    }
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Helper: ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
