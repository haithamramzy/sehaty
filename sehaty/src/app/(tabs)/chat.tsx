import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, MockPlate, Txt } from '@/components';
import { captureImage } from '@/services/camera';
import { sendChat } from '@/services/ai';
import { useApp } from '@/state/store';
import type { ChatMessage, Meal } from '@/data/types';
import { color, font, radius, space, tint } from '@/theme/tokens';

export default function Chat() {
  const { chat, addChatMessage, addMeal, addWater, setMood } = useApp();
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const pickImage = async () => {
    const img = await captureImage('gallery');
    if (img) setPendingImage(img.uri);
  };

  const handleReply = async (userText: string, hasImage: boolean, imageUri?: string) => {
    setBusy(true);
    try {
      const history = chat
        .filter((m) => m.text)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text as string }));
      const reply = await sendChat(userText, hasImage, history, imageUri);

      // Dispatch non-meal actions the model extracted (water, mood, …).
      for (const a of reply.actions ?? []) {
        if (a.type === 'water_log' && a.amount_ml > 0) addWater(a.amount_ml, '💧');
        else if (a.type === 'mood_log' && a.score >= 1 && a.score <= 5) setMood(a.score as 1 | 2 | 3 | 4 | 5);
      }

      if (reply.meal) {
        const meal: Meal = {
          id: `chat-${Date.now()}`,
          type: reply.meal.mealType,
          source: 'chat',
          loggedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          items: reply.meal.items,
          kcal: reply.meal.kcal,
          protein: reply.meal.protein,
          carb: reply.meal.carb,
          fat: reply.meal.fat,
        };
        addChatMessage({ role: 'assistant', text: reply.text, card: meal });
        addMeal(meal); // the chat actually logs it → Home updates
        if (reply.meal.note) addChatMessage({ role: 'assistant', text: reply.meal.note });
      } else {
        addChatMessage({ role: 'assistant', text: reply.text });
      }
    } finally {
      setBusy(false);
      scrollToEnd();
    }
  };

  const send = async () => {
    const t = text.trim();
    const img = pendingImage;
    if (!t && !img) return;
    if (img) addChatMessage({ role: 'user', imageUri: img, text: t || undefined });
    else addChatMessage({ role: 'user', text: t });
    setText('');
    setPendingImage(null);
    scrollToEnd();
    await handleReply(t || 'صورة', Boolean(img), img ?? undefined);
  };

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={[color.ai, color.aiSoft]} style={styles.avatar}>
            <Icon name="spark" size={20} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Txt weight="700" size={14}>
              مستشارك الذكي
            </Txt>
            <View style={styles.status}>
              <View style={styles.statusDot} />
              <Txt size={11} c={color.primary}>
                متاح · Claude
              </Txt>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.fill}
          contentContainerStyle={styles.messages}
          onContentSizeChange={scrollToEnd}
          showsVerticalScrollIndicator={false}
        >
          {chat.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {busy && (
            <View style={styles.aiRow}>
              <Avatar />
              <View style={[styles.aiBubble, { paddingVertical: 14 }]}>
                <Txt size={13} c={color.textTertiary}>
                  ...بيكتب
                </Txt>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputWrap}>
          {pendingImage && (
            <View style={styles.previewStrip}>
              <View style={styles.previewThumb}>
                <MockPlate radius={12} style={StyleSheet.absoluteFill as object} />
                <Pressable style={styles.previewX} onPress={() => setPendingImage(null)}>
                  <Icon name="x" size={8} color="#fff" strokeWidth={3} />
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={12} weight="600">
                  صورة جاهزة للإرسال
                </Txt>
                <Txt size={10} c={color.textMuted}>
                  أضف وصف اختياري تحت
                </Txt>
              </View>
              <View style={styles.aiChip}>
                <Txt size={10} weight="600" c={color.aiSoft}>
                  ✨ AI
                </Txt>
              </View>
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="اكتب أو اسأل..."
              placeholderTextColor={color.textMuted}
              style={styles.input}
              onSubmitEditing={send}
              textAlign="right"
            />
            <Pressable style={styles.inBtn} onPress={pickImage}>
              <Icon name="image" size={16} color={color.textSecondary} />
            </Pressable>
            <Pressable style={styles.inBtn} onPress={pickImage}>
              <Icon name="camera" size={16} color={color.textSecondary} />
            </Pressable>
            <Pressable style={[styles.inBtn, styles.sendBtn]} onPress={send}>
              <Icon name="send" size={16} color={color.onPrimary} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Avatar() {
  return (
    <LinearGradient colors={[color.ai, color.aiSoft]} style={styles.msgAvatar}>
      <Icon name="spark" size={14} color="#fff" />
    </LinearGradient>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userCol}>
          {msg.imageUri && (
            <View style={styles.userImage}>
              <MockPlate radius={16} style={StyleSheet.absoluteFill as object} />
            </View>
          )}
          {msg.text && (
            <View style={styles.userBubble}>
              <Txt size={13} weight="600" c={color.onPrimary} lh={20}>
                {msg.text}
              </Txt>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <Avatar />
      <View style={styles.aiCol}>
        {msg.text && (
          <View style={styles.aiBubble}>
            <Txt size={13} c={color.textHigh} lh={21}>
              {msg.text}
            </Txt>
          </View>
        )}
        {msg.card && <LoggedCard meal={msg.card} />}
      </View>
    </View>
  );
}

/** Inline "تم التسجيل" confirmation card embedded in the assistant reply. */
function LoggedCard({ meal }: { meal: Meal }) {
  const label = { فطار: 'الفطار', غدا: 'الغداء', عشا: 'العشاء', سناك: 'سناك' }[meal.type] ?? meal.type;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardCheck}>
          <Icon name="check" size={10} color={color.onPrimary} strokeWidth={4} />
        </View>
        <Txt size={11} weight="700" c={color.primary}>
          تم التسجيل — {label}
        </Txt>
      </View>
      <View style={{ gap: 6 }}>
        {meal.items.map((it) => (
          <View key={it.id} style={styles.cardItem}>
            <Txt size={12} c={it.flagged ? color.warning : color.textTertiary}>
              {it.emoji} {it.name}
            </Txt>
            <Txt mono size={12} c={it.flagged ? color.warning : color.textPrimary}>
              {it.kcal} kcal
            </Txt>
          </View>
        ))}
      </View>
      <View style={styles.cardTotal}>
        <Txt size={11} c={color.textMuted}>
          الإجمالي
        </Txt>
        <Txt mono weight="700" size={14} c={color.primary}>
          {meal.kcal} kcal
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: color.border },
  avatar: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.primary },

  messages: { padding: space.lg, gap: space.md },
  msgAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  aiRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  aiCol: { flex: 1, gap: space.sm, alignItems: 'flex-start' },
  aiBubble: { maxWidth: '85%', backgroundColor: tint.ai10, borderWidth: 1, borderColor: 'rgba(109,74,255,0.2)', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, borderBottomRightRadius: 4 },

  userRow: { alignItems: 'flex-end' },
  userCol: { maxWidth: '75%', gap: 6, alignItems: 'flex-end' },
  userImage: { width: 180, aspectRatio: 1.1, borderRadius: 16, overflow: 'hidden' },
  userBubble: { backgroundColor: color.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, borderBottomLeftRadius: 4 },

  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, padding: space.md, maxWidth: '90%' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 10 },
  cardCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  cardItem: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: color.border, marginTop: 10, paddingTop: 10 },

  inputWrap: { paddingHorizontal: space.lg, paddingBottom: space.xl, paddingTop: space.sm },
  previewStrip: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: 'rgba(28,28,32,0.85)', borderWidth: 1, borderColor: color.border, borderRadius: 18, padding: 10, marginBottom: space.sm },
  previewThumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden' },
  previewX: { position: 'absolute', top: -6, left: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: color.bgDark, borderWidth: 2, borderColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  aiChip: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: tint.ai15, borderWidth: 1, borderColor: tint.ai30, borderRadius: radius.sm },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.lg, paddingVertical: 8, paddingHorizontal: 8, paddingRight: 14 },
  input: { flex: 1, color: color.textPrimary, fontFamily: font.regular, fontSize: 13 },
  inBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: color.elevated, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { backgroundColor: color.primary },
});
