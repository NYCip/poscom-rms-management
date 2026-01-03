import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

const SALT_ROUNDS = 12;

export class UserManager {
  private usersFile: string;
  private users: Map<string, User> = new Map();

  constructor(rmsDir: string) {
    this.usersFile = join(rmsDir, 'users.json');
  }

  async initialize(): Promise<void> {
    try {
      const content = await readFile(this.usersFile, 'utf-8');
      const users: User[] = JSON.parse(content);
      this.users = new Map(users.map(u => [u.username, u]));
    } catch {
      // Create default admin user if no users file exists
      await this.createDefaultAdmin();
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    const defaultPassword = process.env['RMS_ADMIN_PASSWORD'] || 'Admin123!';
    await this.createUser('admin', defaultPassword, 'admin');
    console.log('Created default admin user. Username: admin');
    console.log('IMPORTANT: Change the default password immediately!');
  }

  async createUser(username: string, password: string, role: User['role'] = 'user'): Promise<User> {
    if (this.users.has(username)) {
      throw new Error(`User ${username} already exists`);
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new Error('Password must contain uppercase, lowercase, and number');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user: User = {
      id: `user-${Date.now()}`,
      username,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };

    this.users.set(username, user);
    await this.save();
    return user;
  }

  async validatePassword(username: string, password: string): Promise<User | null> {
    const user = this.users.get(username);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    // Update last login
    user.lastLogin = new Date().toISOString();
    await this.save();

    return user;
  }

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.validatePassword(username, oldPassword);
    if (!user) return false;

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.save();
    return true;
  }

  getUser(username: string): Omit<User, 'passwordHash'> | null {
    const user = this.users.get(username);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  listUsers(): Array<Omit<User, 'passwordHash'>> {
    return Array.from(this.users.values()).map(({ passwordHash, ...user }) => user);
  }

  async deleteUser(username: string): Promise<boolean> {
    if (username === 'admin') {
      throw new Error('Cannot delete admin user');
    }
    const deleted = this.users.delete(username);
    if (deleted) await this.save();
    return deleted;
  }

  private async save(): Promise<void> {
    const users = Array.from(this.users.values());
    await writeFile(this.usersFile, JSON.stringify(users, null, 2));
  }
}
