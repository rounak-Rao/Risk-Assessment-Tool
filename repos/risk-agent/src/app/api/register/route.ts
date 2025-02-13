import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from '@/db/database';
import { checkUserExists } from '@/utils/auth';
import { verifyEmail } from '@/utils/emailVerification';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, firstName, lastName, phoneNumber, address, telegramChatId } = body;

  try {
    // Verify email first
    const emailVerification = await verifyEmail(email);
    if (!emailVerification.valid) {
      return NextResponse.json({ 
        error: "Invalid email address",
        details: emailVerification.details 
      }, { status: 400 });
    }

    // Check if user exists
    const exists = await checkUserExists(email);
    if (exists) {
      return NextResponse.json({ 
        error: "User with this email already exists" 
      }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (email, password, first_name, last_name, phone_number, address, telegram_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, firstName, lastName, phoneNumber, address, telegramChatId],
        function(err) {
          if (err) {
            resolve(NextResponse.json({ error: "User registration failed" }, { status: 500 }));
            return;
          }
          
          resolve(NextResponse.json({ 
            user: { 
              id: this.lastID, 
              email: email 
            } 
          }, { status: 201 }));
        }
      );
    });
  } catch (error) {
    return NextResponse.json({ error: "User registration failed" }, { status: 500 });
  }
}

