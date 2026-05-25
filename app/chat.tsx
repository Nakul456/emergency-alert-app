import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../components/ThemeContext";
import Animated, { FadeInDown, FadeInRight, FadeInLeft } from "react-native-reanimated";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I am your Emergency AI Assistant. How can I help you today?", sender: 'ai', timestamp: 'Just now' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsgText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMsgText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
      if (!apiKey) {
        throw new Error("EXPO_PUBLIC_GROQ_API_KEY is not defined");
      }

      // We maintain the chat history for a highly contextual medical consultation
      const contextMessages = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      contextMessages.push({ role: 'user', content: userMsgText });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are CareWave AI, a professional emergency first-aid assistant. Keep replies extremely concise, clear, and easy to read for seniors or people in high-stress situations. Use bullet points for steps and wrap important warnings or headers in **double asterisks** for bold emphasis. Always prompt them to dial emergency services (911/112) if the situation seems severe."
            },
            ...contextMessages
          ],
          temperature: 0.5,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const responseData = await response.json();
      const aiReply = responseData?.choices?.[0]?.message?.content || "I understand. Please let me know how else I can assist, or press the red SOS button for immediate alerts.";

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiReply,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.log("Groq Chat Error:", error);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "🚨 **Error Connecting to AI service.**\n\nIf you are facing a real emergency, please call local emergency services immediately or press the manual SOS trigger.",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageText = (text: string, isUser: boolean) => {
    // Regex splits by bold asterisks to render them in different inline weights
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={[styles.messageText, { color: isUser ? '#fff' : colors.text }]}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={index} style={{ fontWeight: '900', color: isUser ? '#fff' : '#EF4444' }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
           <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI ASSISTANT</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <Animated.View 
            key={msg.id} 
            entering={msg.sender === 'user' ? FadeInRight : FadeInLeft}
            style={[
              styles.messageWrapper, 
              msg.sender === 'user' ? styles.userMsgWrapper : styles.aiMsgWrapper
            ]}
          >
             <View style={[
               styles.messageBox, 
               msg.sender === 'user' 
                 ? { backgroundColor: '#EF4444' } 
                 : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
             ]}>
                {renderMessageText(msg.text, msg.sender === 'user')}
                <Text style={[
                  styles.msgTime, 
                  { color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : colors.subText }
                ]}>
                  {msg.timestamp}
                </Text>
             </View>
          </Animated.View>
        ))}
        {isTyping && (
          <View style={styles.aiMsgWrapper}>
             <View style={[styles.messageBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <ActivityIndicator size="small" color="#EF4444" />
             </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
         <TextInput
           style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
           placeholder="Type your emergency question..."
           placeholderTextColor={colors.subText}
           value={input}
           onChangeText={setInput}
           multiline
         />
         <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="send" size={20} color="#fff" />
         </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", letterSpacing: 2, marginLeft: 15 },
  chatContent: { padding: 20, paddingBottom: 40 },
  messageWrapper: { marginBottom: 20, width: '100%' },
  userMsgWrapper: { alignItems: 'flex-end' },
  aiMsgWrapper: { alignItems: 'flex-start' },
  messageBox: { maxWidth: '85%', padding: 15, borderRadius: 22 },
  messageText: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  msgTime: { fontSize: 10, fontWeight: "700", marginTop: 5, textAlign: 'right' },
  inputContainer: { padding: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1 },
  textInput: { flex: 1, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, maxHeight: 100, fontSize: 15, fontWeight: "600" },
  sendBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
});
