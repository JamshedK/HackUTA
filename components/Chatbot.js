import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, ActivityIndicator, Platform, View
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/styles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { OPENAI_KEY } from '@env';


const Chatbot = ({navigation}) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('chatHistory');
        if (storedHistory) setChatHistory(JSON.parse(storedHistory));
      } catch (error) {
        console.error("Error fetching chat history from storage:", error);
      }
    };
    fetchChatHistory();
  }, []);

  const handleSend = async () => {
    if (message.trim() === '') return;
  
    const userMessage = { role: 'user', content: message.trim() };
    setChatHistory(currentHistory => [...currentHistory, userMessage]);
    
    setIsLoading(true);
  
    const chatData = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": "You're a car maintenance expert"
        },
        userMessage
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
  
    console.log("Sending to GPT model:", chatData);
  
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', chatData, {
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
      });
  
      const botResponseText = response.data.choices[0]?.message.content.trim();
      const botMessage = { role: 'bot', content: botResponseText };
      const updatedHistory = [...chatHistory, userMessage, botMessage];
      
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  
    setIsLoading(false);
    setMessage('');
  };

  const renderItem = ({ item }) => (
    <View style={item.role === 'user' ? styles.userMessage : styles.botMessage}>
      <Text>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{flex:1}}>
        <FlatList
          data={chatHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messageContainer}
        />
        {isLoading && (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
        )}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default Chatbot;