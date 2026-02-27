const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    // Initialize client only if credentials exist
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      console.warn('Twilio credentials not configured. OTP service will not work.');
      this.client = null;
    }
  }

  // Format phone number with country code (default to India +91)
  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');

    // Remove any existing + prefix for processing
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }

    // If it's a 10-digit Indian number, add +91
    if (formatted.length === 10 && /^[6-9]\d{9}$/.test(formatted)) {
      formatted = '91' + formatted;
    }

    // If it starts with 91 and is 12 digits, it's already Indian format
    if (formatted.startsWith('91') && formatted.length === 12) {
      return '+' + formatted;
    }

    // Add + prefix if not present
    return '+' + formatted;
  }

  // Send OTP via SMS
  async sendOTP(phoneNumber, otp) {
    if (!this.client) {
      throw new Error('Twilio not configured. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }

    if (!this.fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured in .env');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`Sending SMS OTP to: ${formattedNumber} from: ${this.fromNumber}`);

      const message = await this.client.messages.create({
        body: `Your Smart Agriculture verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
        from: this.fromNumber,
        to: formattedNumber
      });

      console.log(`SMS OTP sent successfully: ${message.sid}`);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Twilio SMS Error:', error.message);
      console.error('Error Code:', error.code);
      console.error('More Info:', error.moreInfo);

      // Provide specific error messages based on Twilio error codes
      if (error.code === 21608) {
        throw new Error('SMS: The phone number is unverified. Trial accounts can only send to verified numbers.');
      } else if (error.code === 21211) {
        throw new Error('SMS: Invalid phone number format. Please include country code (e.g., +91).');
      } else if (error.code === 21614) {
        throw new Error('SMS: This number cannot receive SMS messages.');
      } else if (error.code === 20003) {
        throw new Error('SMS: Twilio authentication failed. Check your Account SID and Auth Token.');
      } else {
        throw new Error(`SMS Error: ${error.message}`);
      }
    }
  }

  // Send OTP via WhatsApp
  async sendWhatsAppOTP(phoneNumber, otp) {
    if (!this.client) {
      throw new Error('Twilio not configured. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`Sending WhatsApp OTP to: whatsapp:${formattedNumber} from: ${this.whatsappFrom}`);

      const message = await this.client.messages.create({
        from: this.whatsappFrom,
        to: `whatsapp:${formattedNumber}`,
        body: `🌾 *AgriBot Verification*\n\nYour OTP is: *${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.`
      });

      console.log(`WhatsApp OTP sent successfully: ${message.sid}`);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Twilio WhatsApp Error:', error.message);
      console.error('Error Code:', error.code);
      console.error('More Info:', error.moreInfo);

      // Provide specific error messages based on Twilio error codes
      if (error.code === 63007) {
        throw new Error('WhatsApp: User has not joined the sandbox. Send "join <sandbox-code>" to +14155238886 on WhatsApp first.');
      } else if (error.code === 63016) {
        throw new Error('WhatsApp: Message failed to send. The user may not have WhatsApp or has not opted in.');
      } else if (error.code === 21211) {
        throw new Error('WhatsApp: Invalid phone number format. Please include country code (e.g., +91).');
      } else if (error.code === 20003) {
        throw new Error('WhatsApp: Twilio authentication failed. Check your Account SID and Auth Token.');
      } else if (error.code === 21608) {
        throw new Error('WhatsApp: For sandbox, user must first send "join <code>" to the Twilio WhatsApp number.');
      } else {
        throw new Error(`WhatsApp Error: ${error.message}`);
      }
    }
  }

  // Send WhatsApp message using content template
  async sendWhatsAppTemplate(phoneNumber, contentSid, contentVariables = {}) {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const message = await this.client.messages.create({
        from: this.whatsappFrom,
        to: `whatsapp:${formattedNumber}`,
        contentSid: contentSid,
        contentVariables: JSON.stringify(contentVariables)
      });

      console.log(`WhatsApp template sent: ${message.sid}`);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending WhatsApp template:', error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  async sendNotification(phoneNumber, message) {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('Error sending notification:', error.message);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  async sendWeatherAlert(phoneNumber, weatherData) {
    const message = `Weather Alert: ${weatherData.alert}. Current: ${weatherData.temp}°C, ${weatherData.condition}. Plan your farming activities accordingly.`;
    return this.sendNotification(phoneNumber, message);
  }

  async sendNewsAlert(phoneNumber, newsTitle) {
    const message = `Agriculture News: ${newsTitle}. Open the app for more details.`;
    return this.sendNotification(phoneNumber, message);
  }
}

module.exports = new TwilioService();
