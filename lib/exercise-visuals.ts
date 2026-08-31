/**
 * Egzersiz Animasyonları, GIF Kaynakları ve Canlı Hareket Rehberleri
 */

export interface ExerciseVisualData {
  gifUrl: string;
  thumbnailUrl: string;
  targetMuscles: string[];
  tips: string[];
}

export const EXERCISE_VISUALS: Record<string, ExerciseVisualData> = {
  "dumbbell floor press / bench press": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Göğüs (Pectoralis Major)", "Triceps", "Ön Omuz"],
    tips: ["Dirsekleri gövdeye 45-60 derece açıyla tutun", "Yere kontrollü inip 1 saniye duraklayın", "Tepe noktada göğsü sıkın"],
  },
  "incline dumbbell press (açılı sehpa/minder)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Üst Göğüs (Clavicular Head)", "Ön Omuz", "Triceps"],
    tips: ["Sehpa açısını 30-45 derece yapın", "Kürek kemiklerini sehpaya kilitleyin"],
  },
  "dumbbell shoulder press (omuz presi)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Ön & Yan Omuz", "Triceps", "Üst Göğüs"],
    tips: ["Dambılları kulak hizasından yukarı itin", "Beli geriye kavis yapmayın, karın kaslarını sıkın"],
  },
  "dumbbell lateral raise (yan omuz)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Yan Omuz (Lateral Deltoid)"],
    tips: ["Dirsekleri hafif bükülü tutun", "Ağırlığı değil dirseği kaldırmaya odaklanın", "Tepe noktada duraklayın"],
  },
  "dumbbell overhead triceps extension": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Seated-Dumbbell-Triceps-Extension.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Triceps (Arka Kol Uzun Baş)"],
    tips: ["Dirseklerin dışa açılmasını engelleyin", "Tam hareket aralığı ile esnetin"],
  },
  "şınav (push-up)": {
    gifUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Push-ups-2.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Göğüs", "Triceps", "Core", "Ön Omuz"],
    tips: ["Vücut tahta gibi düz kalmalı", "Göğüs yere değene kadar inin"],
  },
  "pull-up (barfiks - geniş/normal tutuş)": {
    gifUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Pull-ups-2.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Kanat (Latissimus Dorsi)", "Biceps", "Üst Sırt", "Ön Kol"],
    tips: ["Kürek kemiklerini sıkarak başlayın", "Çeneyi barın üzerine çıkarın", "İnişi 2-3 saniyede yavaş yapın"],
  },
  "chin-up (barfiks - avuç içi bize dönük)": {
    gifUrl: "https://upload.wikimedia.org/wikipedia/commons/6/69/Chin-ups-1.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Biceps", "Alt Kanat", "Sırt"],
    tips: ["Avuç içleri size dönük tutun", "Göğsü bara yaklaştırın"],
  },
  "tek kol dumbbell row (testere çekiş)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Kanat (Lats)", "Arka Omuz", "Biceps"],
    tips: ["Dambılı cebinize doğru çekin", "Sırtı yere paralel tutun", "Tepe noktada kanadı sıkın"],
  },
  "çift kol dumbbell bent-over row": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bent-Over-Two-Arm-Dumbbell-Row.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Tüm Sırt", "Trapez", "Biceps"],
    tips: ["Kalçayı geriye iterek 45 derece eğilin", "Beli düz tutun"],
  },
  "dumbbell biceps curl": {
    gifUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Biceps-curls-1.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Biceps (Ön Kol Pazı)"],
    tips: ["Dirsekleri gövdeye sabitleyin", "Tepe noktada bileği hafif dışa çevirin"],
  },
  "dumbbell hammer curl (çekiç biceps)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Brachialis (Kol Kalınlığı)", "Ön Kol", "Biceps"],
    tips: ["Avuç içleri birbirine baksın", "Bilekleri bükmeyin"],
  },
  "rear delt fly (eğilerek arka omuz)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Rear-Lateral-Raise.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Arka Omuz (Rear Deltoid)", "Üst Sırt"],
    tips: ["Hafif ağırlık seçin", "Dirsekleri hafif bükülü yana açın"],
  },
  "goblet squat (dambıl ile derin squat)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Goblet-Squat.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Ön Bacak (Quads)", "Kalça (Glutes)", "Core"],
    tips: ["Dambılı göğüste dikey tutun", "Topukları yerden kaldırmadan derin çömelin"],
  },
  "bulgarian split squat": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dumbbell-Bulgarian-Split-Squat.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Ön & Arka Bacak", "Kalça (Glutes)"],
    tips: ["Ağırlığı ön ayakta tutun", "Ön diz 90 derece bükülsün"],
  },
  "romanian deadlift (dumbbell rdl)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Arka Bacak (Hamstrings)", "Kalça", "Bel"],
    tips: ["Dizleri hafif kırıp kalçayı geriye itin", "Sırtı dümdüz tutun"],
  },
  "dumbbell calf raise (kalf yükselişi)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Calf-Raise.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Kalf (Baldır Kasları)"],
    tips: ["Parmak ucunda en tepeye yükselin", "2 saniye sıkıp yavaş inin"],
  },
  "ab-wheel rollout (karın tekeri)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Ab-Wheel-Rollout.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Tüm Karın (Rectus Abdominis)", "Merkez Bölge (Core)", "Kanat"],
    tips: ["Beli asla çökertmeyin", "Karın gücüyle geri çekin"],
  },
  "hanging knee / leg raise (barfikste karın)": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hanging-Leg-Raise.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Alt Karın", "Kalça Fleksörleri"],
    tips: ["Salınımı durdurun", "Dizleri göğse kontrollü çekin"],
  },
  "plank / side plank": {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Plank.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Derin Karın (Transverse Abdominis)", "Glutes", "Omuz"],
    tips: ["Tüm vücudu tahta gibi gergin tutun", "Düzgün nefes alıp verin"],
  },
};

export function getExerciseVisual(name: string): ExerciseVisualData {
  const cleanName = name.toLowerCase().trim();
  
  if (EXERCISE_VISUALS[cleanName]) {
    return EXERCISE_VISUALS[cleanName];
  }

  // Fuzzy search
  for (const key of Object.keys(EXERCISE_VISUALS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return EXERCISE_VISUALS[key];
    }
  }

  // Fallback defaults
  return {
    gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press.gif",
    thumbnailUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
    targetMuscles: ["Hedef Kas Grubu"],
    tips: ["Kontrollü tempo uygulayın", "Tam hareket aralığı kullanın"],
  };
}
