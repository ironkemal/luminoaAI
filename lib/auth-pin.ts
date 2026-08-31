import { AppUser } from "@/types";
import { createClient } from "./supabase/client";

export const INVITATION_PIN = "4004";
const USER_STORAGE_KEY = "lumino_current_user";

export function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AppUser | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function isAppUnlocked(): boolean {
  return getCurrentUser() !== null;
}

export function logout(): void {
  setCurrentUser(null);
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

export function lockApp(): void {
  logout();
}

/**
 * Register new user with Invitation PIN (4004)
 */
export async function registerWithInvitationPin(
  pin: string,
  username: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; error?: string; user?: AppUser }> {
  if (pin !== INVITATION_PIN) {
    return { success: false, error: "Geçersiz Davetiye Kodu! Lütfen size verilen PIN kodunu girin." };
  }

  if (!username || username.trim().length < 3) {
    return { success: false, error: "Kullanıcı adı en az 3 karakter olmalıdır." };
  }

  if (!password || password.length < 4) {
    return { success: false, error: "Şifre en az 4 karakter olmalıdır." };
  }

  const cleanUsername = username.trim().toLowerCase();
  const supabase = createClient();

  try {
    // Check if username taken
    const { data: existing } = await supabase
      .from("app_users")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Bu kullanıcı adı zaten kullanımda." };
    }

    // Create user
    const { data: newUser, error: createErr } = await supabase
      .from("app_users")
      .insert({
        username: cleanUsername,
        password_hash: password, // For simplicity in this personal multi-user setup
        display_name: displayName || username,
        height_cm: 180.0,
        target_weight_kg: 85.0,
      })
      .select()
      .single();

    if (createErr || !newUser) {
      throw createErr || new Error("Kullanıcı oluşturulamadı.");
    }

    const createdAppUser: AppUser = {
      id: newUser.id,
      username: newUser.username,
      display_name: newUser.display_name,
      height_cm: newUser.height_cm,
      target_weight_kg: newUser.target_weight_kg,
      created_at: newUser.created_at,
    };

    // Clone default 5 workout routines and exercises for this new user
    await cloneDefaultRoutinesForUser(newUser.id);

    setCurrentUser(createdAppUser);
    return { success: true, user: createdAppUser };
  } catch (err: any) {
    console.error("Registration error:", err);
    return { success: false, error: err.message || "Kayıt sırasında hata oluştu." };
  }
}

/**
 * Login with username + password
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: AppUser }> {
  if (!username || !password) {
    return { success: false, error: "Lütfen kullanıcı adı ve şifrenizi girin." };
  }

  const cleanUsername = username.trim().toLowerCase();
  const supabase = createClient();

  try {
    const { data: user, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (error || !user) {
      return { success: false, error: "Kullanıcı bulunamadı. Lütfen kayıt olun." };
    }

    if (user.password_hash !== password) {
      return { success: false, error: "Hatalı şifre!" };
    }

    const loggedInUser: AppUser = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      height_cm: user.height_cm,
      target_weight_kg: user.target_weight_kg,
      created_at: user.created_at,
    };

    setCurrentUser(loggedInUser);
    return { success: true, user: loggedInUser };
  } catch (err: any) {
    console.error("Login error:", err);
    return { success: false, error: err.message || "Giriş yapılamadı." };
  }
}

/**
 * Clone template routines for newly registered users
 */
async function cloneDefaultRoutinesForUser(userId: string) {
  const supabase = createClient();

  const defaultRoutines = [
    { name: "İtiş A (Göğüs - Omuz - Triceps)", sequence_order: 1, description: "Ağır dambıl göğüs presi ve omuz kuvveti" },
    { name: "Çekiş A (Sırt - Biceps - Arka Omuz)", sequence_order: 2, description: "Barfiks dikey çekiş ve tek kol dambıl row" },
    { name: "Bacak & Core (Kuvvet & Karın)", sequence_order: 3, description: "Goblet squat, RDL ve Ab-Wheel rollout" },
    { name: "İtiş B (Hipertrofi & Hacim)", sequence_order: 4, description: "Incline press, lateral raise ve şınav" },
    { name: "Çekiş B (Kanat & Kol Yoğunluğu)", sequence_order: 5, description: "Chin-up, çift kol row ve hammer curl" },
  ];

  const { data: exercises } = await supabase.from("exercises").select("*");
  const exMap = new Map((exercises || []).map((e) => [e.name.toLowerCase(), e.id]));

  for (const r of defaultRoutines) {
    const { data: newR } = await supabase
      .from("workout_routines")
      .insert({
        user_id: userId,
        name: r.name,
        sequence_order: r.sequence_order,
        description: r.description,
        is_active: true,
      })
      .select()
      .single();

    if (!newR) continue;

    // Attach basic exercises to new routines
    const exerciseList = exercises?.slice(0, 5) || [];
    for (let i = 0; i < exerciseList.length; i++) {
      await supabase.from("routine_exercises").insert({
        routine_id: newR.id,
        exercise_id: exerciseList[i].id,
        order_in_routine: i + 1,
        target_sets: 3,
        target_reps: "8-12",
        target_weight_kg: 15.0,
      });
    }
  }
}
