export type TargetMuscle =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core";

export type EquipmentType =
  | "Dumbbell"
  | "Bodyweight"
  | "Ab-Wheel"
  | "Pull-up Bar";

export type PhotoTiming = "pre_workout" | "post_workout";
export type PhotoPose = "front" | "side" | "back" | "other";

export interface AppUser {
  id: string;
  username: string;
  display_name?: string | null;
  height_cm?: number;
  target_weight_kg?: number;
  created_at?: string;
}

export interface Exercise {
  id: string;
  name: string;
  target_muscle: TargetMuscle;
  secondary_muscles?: string[];
  equipment: EquipmentType;
  default_rest_seconds: number;
  instructions?: string | null;
  form_cues?: string[];
  common_mistakes?: string[];
  image_url?: string | null;
  video_url?: string | null;
  created_at?: string;
}

export interface WorkoutRoutine {
  id: string;
  user_id?: string;
  name: string;
  sequence_order: number;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_in_routine: number;
  target_sets: number;
  target_reps: string;
  target_weight_kg: number;
  notes?: string | null;
  created_at?: string;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id?: string;
  routine_id: string | null;
  started_at: string;
  completed_at: string | null;
  notes?: string | null;
  rpe_score?: number | null;
  created_at?: string;
  routine?: WorkoutRoutine;
  set_logs?: SetLog[];
}

export interface SetLog {
  id?: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  actual_reps: number;
  actual_weight_kg: number;
  completed: boolean;
  created_at?: string;
  exercise?: Exercise;
}

export interface BodyMetric {
  id: string;
  user_id?: string;
  recorded_at: string;
  weight_kg: number;
  waist_cm?: number | null;
  arm_cm?: number | null;
  chest_cm?: number | null;
  notes?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface ProgressPhoto {
  id: string;
  user_id?: string;
  photo_url: string;
  timing: PhotoTiming; // 'pre_workout' (Soğuk) vs 'post_workout' (Pump)
  pose: PhotoPose; // 'front', 'side', 'back', 'other'
  weight_kg?: number | null;
  recorded_at: string;
  notes?: string | null;
  created_at?: string;
}

export interface AiCoachLog {
  id: string;
  user_id?: string;
  created_at: string;
  evaluation_summary: string;
  suggested_changes?: {
    recommendations?: {
      exercise: string;
      routine?: string;
      exercise_id?: string;
      action: "increase_weight" | "increase_reps" | "increase_sets" | "decrease_weight" | "form_focus";
      old_val?: string;
      new_val: string;
      reason?: string;
    }[];
    recomp_assessment?: {
      status: "recomposing" | "cutting" | "plateau" | "bulking";
      explanation: string;
      estimated_progress: string;
    };
    nutrition_tip?: string;
  } | null;
  applied: boolean;
}

export interface ActiveWorkoutState {
  routine: WorkoutRoutine;
  exercises: (RoutineExercise & { exercise: Exercise })[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: Record<string, SetLog[]>;
  isResting: boolean;
  restRemainingSeconds: number;
  startedAt: string;
}

export interface QueueStatus {
  nextRoutine: WorkoutRoutine;
  lastSession: WorkoutSession | null;
  hoursSinceLastWorkout: number | null;
  recoveryStatus: "fresh" | "recovering" | "ready";
  recoveryMessage: string;
}

export interface ChatSession {
  id: string;
  user_id?: string | null;
  title: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    actionProposal?: {
      type: "create_program" | "apply_overload";
      title: string;
      description?: string;
      program_data?: any;
    } | null;
    proposalApplied?: boolean;
    created_at?: string;
  }[];
  created_at: string;
  updated_at: string;
}

