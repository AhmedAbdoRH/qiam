import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquareText, Send } from 'lucide-react';

interface Message {
  text: string;
  isSender: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { text: inputValue, isSender: true }]);
      setInputValue('');
      // Simulate a response for demonstration
      // setTimeout(() => {
      //   setMessages((prevMessages) => [...prevMessages, { text: "This is a simulated response.", isSender: false }]);
      // }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-32 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-lg border border-black/50 shadow-lg transition-all hover:scale-110 hover:bg-black/30">
          <MessageSquareText className="h-6 w-6 text-white/20" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black/30 backdrop-blur-lg rounded-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white"></DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">No messages yet.</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`flex mb-2 ${msg.isSender ? 'justify-end' : 'justify-start'}`}>
                  <span className={`inline-block p-2 rounded-2xl max-w-[80%] break-words ${msg.isSender ? 'bg-gray-700 text-white' : 'bg-gray-700 text-white'}`}>
                    {msg.text}
                  </span>
                </div>
              ))
            )}
          </ScrollArea>
          <div className="flex items-center space-x-2">
            <Textarea
              placeholder=""
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="rounded-full flex-grow"
            />
            <Button onClick={handleSendMessage} className="rounded-full bg-gray-800 hover:bg-gray-700"><Send className="h-5 w-5" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}