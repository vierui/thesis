"use client";
import React, { useEffect, useRef, useState } from "react";
import { BsPencilSquare, BsLayoutSidebarInset, BsMoon, BsSun } from "react-icons/bs"; // Importing the icons
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LuSendHorizontal, LuNotebookText } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { MessageProps, DocumentProps } from "@/types";
import Link from "next/link";
import ChatBox from "@/components/prompt/chat-box";
import ModelOptions from "@/components/prompt/model-options";
import { answerQuestions } from "@/lib/utils";
import { UserProfileProps } from "@/types";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useStore, useSidebarState } from "@/lib/useStore";
import SessionDialog from "@/components/session_dialog";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@clerk/nextjs";
import { useHasMounted } from "@/hooks/useHasMounted";

// import { DocumentProps } from "@/types";
import SourceDetailModal from "@/components/prompt/source-detail-modal";
import EvalResultModal from "@/components/prompt/eval-result-modal";
import { Doc } from "zod/v4/core";

type Props = {
  user: UserProfileProps | null;
  conversations: MessageProps[];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const PromptPage = ({ user, conversations }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, setIsOpen } = useSidebarState();
  const hyde = searchParams.get("hyde");
  const reranking = searchParams.get("reranking");
  const selected_model = searchParams.get("selected_model");
  const temperature = searchParams.get("temperature");
  const { slug } = useParams();
  const [responseTime, setResponseTime] = useState<number>(0);
  const [data, setData] = useState<MessageProps[]>(conversations);
  const [prompt, setPrompt] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(
    selected_model ? selected_model.toString() : "Llama 3 8B - 4 bit quantization"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [isHydeChecked, setIsHydeChecked] = useState<boolean>(
    hyde === null ? true : hyde === "true"
  );
  const [isRerankingChecked, setIsRerankingChecked] = useState<boolean>(
    reranking === null ? true : reranking === "true"
  );

  const [isUltrathinkChecked, setIsUltrathinkChecked] = useState<boolean>(false);
  const [temperatures, setTemperature] = useState<number>(
    temperature ? Number(temperature) : 0
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const messageIdCounterRef = useRef<number>(0);

  const triggerFunction = useStore((state) => state.triggerFunction);
  const [enableScroll, setEnableScroll] = useState<boolean>(true);
  const { getToken } = useAuth();
  const hasMounted = useHasMounted();

  const scrollDown = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (divRef.current && !isPrompting && prompt === "") {
      divRef.current.innerText = "Start a conversation with LKC";
      divRef.current.classList.add("text-slate-400");
      divRef.current.blur();
    } else if (divRef.current && divRef.current.innerText === "Start a conversation with LKC") {
      divRef.current.innerText = "";
      divRef.current.classList.remove("text-slate-400");
    }
  }, [isPrompting, prompt]);

  useEffect(() => {
    if (enableScroll) {
      scrollDown();
    }
  }, [data, enableScroll]);

  useEffect(() => {
  // Setiap kali 'conversations' (prop dari server) berubah,
  // paksa 'data' (state lokal) buat ikut berubah.
  setData(conversations);
  setEvaluatingMessageId(null); 
}, [conversations]);


const handleSendPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    const userMessageText = prompt;
    setPrompt("");
    if (divRef.current) divRef.current.innerText = "";
    setIsPrompting(false);

    // --- Langkah 1: Update UI secara instan ---
    const tempUserMessage: MessageProps = {
        type: "request",
        message: userMessageText,
        message_id: `temp-user-${messageIdCounterRef.current++}`
    };
    const tempAiMessage: MessageProps = {
        type: "response",
        message: "",
        message_id: `temp-ai-${messageIdCounterRef.current++}`,
        sourceDocs: [],
    };

    setData(currentData => [...currentData, tempUserMessage, tempAiMessage]);

    // --- Langkah 2: Mulai proses streaming dari backend ---
    const startTime = performance.now();
    try {
        const response = await fetch("/api/chat", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: userMessageText,
                userId: user?.id || "",
                conversation_history: data,
                hyde: isHydeChecked.toString(),
                reranking: isRerankingChecked.toString(),
                ultrathink: isUltrathinkChecked.toString()
            }),
        });

        if (!response.body) throw new Error("Response body is null");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let fullThinking = "";
        let retrievedDocsData: DocumentProps[] = [];

        let buffer = ""; // Ini penampungan sementara kita

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.indexOf('\n\n');

            while (boundary !== -1) {
                const message = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 2);

                if (message.startsWith('data: ')) {
                    const dataStr = message.substring(6).trim();

                    if (dataStr && dataStr !== '[DONE]') {
                        try {
                            const parsedData = JSON.parse(dataStr);

                            if (parsedData.answer_token) {
                                fullResponse += parsedData.answer_token;
                                setData(currentData =>
                                    currentData.map(msg =>
                                        msg.message_id === tempAiMessage.message_id
                                            ? { ...msg, message: fullResponse, thinking: fullThinking }
                                            : msg
                                    )
                                );
                            }

                            if (parsedData.thinking_token) {
                                fullThinking += parsedData.thinking_token;
                                setData(currentData =>
                                    currentData.map(msg =>
                                        msg.message_id === tempAiMessage.message_id
                                            ? { ...msg, thinking: fullThinking, message: fullResponse }
                                            : msg
                                    )
                                );
                            }

                            if (parsedData.retrieved_doc) {
                                retrievedDocsData.push(parsedData.retrieved_doc);
                                setData(currentData =>
                                    currentData.map(msg =>
                                        msg.message_id === tempAiMessage.message_id
                                            ? { ...msg, sourceDocs: [...retrievedDocsData] }
                                            : msg
                                    )
                                );
                            }
                        } catch (e) {
                            console.error("Gagal parse JSON dari potongan data:", dataStr, e);
                        }
                    }
                }
                boundary = buffer.indexOf('\n\n');
            }
        }

        // Calculate and set response time
        setResponseTime(Math.round(performance.now() - startTime));

        // Validate data before saving
        if (!fullResponse || fullResponse.trim() === "") {
            console.error("Cannot save message: response is empty");
            toast.error("Failed to save message: empty response");
            return;
        }

        if (!user?.id) {
            console.error("Cannot save message: user ID not available");
            toast.error("User session is not ready. Please try again.");
            return;
        }

        console.log("Saving message:", {
            userMessageLength: userMessageText.length,
            responseLength: fullResponse.length,
            userId: user.id,
            chatBoxId: slug ? slug[0] : "new",
            retrievedDocsCount: retrievedDocsData.length
        });

        let realMessageId: string | undefined;
        if (!slug) {
            realMessageId = await handleNewChatBox(userMessageText, fullResponse, retrievedDocsData);
        } else {
            realMessageId = await handleSaveResponse(userMessageText, fullResponse, retrievedDocsData, slug[0]);
        }
        if (realMessageId) {
            setData(currentData =>
                currentData.map(msg =>
                    msg.message_id === tempAiMessage.message_id
                        ? { ...msg, message_id: realMessageId }
                        : msg
                )
            );
        }
    } catch (error) {
        console.error('Failed to stream message:', error);
        setData(currentData =>
            currentData.map(msg =>
                msg.message_id === tempAiMessage.message_id
                    ? { ...msg, message: "Sorry, an error occurred during streaming." }
                    : msg
            )
        );
    } finally {
        setIsLoading(false);
        scrollDown();
        setPrompt("");
        setIsPrompting(false);
    }
};


  const handleRating = (value: number, i: number) => {
    setEnableScroll(false);
    const newData = [...data];
    newData[i].rating = value;
    setData(newData);
  };

  const handleLike = (i: number) => {
    setEnableScroll(false);
    const newData = [...data];
    if (
      newData[i].liked === false ||
      newData[i].liked === null ||
      newData[i].liked === undefined
    ) {
      newData[i].liked = true;
      newData[i].disliked = false;
    } else {
      newData[i].liked = false;
    }
    setData(newData);
  };

  const handleDislike = (i: number) => {
    setEnableScroll(false);
    const newData = [...data];
    if (
      newData[i].disliked === false ||
      newData[i].disliked === null ||
      newData[i].disliked === undefined
    ) {
      newData[i].disliked = true;
      newData[i].liked = false;
    } else {
      newData[i].disliked = false;
    }
    setData(newData);
  };

  const handleUpdateMisc = async (i: number) => {
    setEnableScroll(false);
    const newData = [...data];
    const messageId = newData[i].message_id;

    // Validation: Check if message_id exists and is valid
    if (!messageId) {
      toast.error("Cannot update: Message ID is missing");
      return;
    }

    // Check if it's a temporary ID (starts with "temp-")
    if (messageId.startsWith("temp-")) {
      toast.error("Please wait for the message to be saved before updating");
      return;
    }

    // Check if message type is response (only responses should be updated)
    if (newData[i].type !== "response") {
      toast.error("Cannot update: Only AI responses can be rated");
      return;
    }

    // Verify ID is numeric (can be converted to valid integer)
    const numericId = Number(messageId);
    if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
      toast.error("Cannot update: Invalid message ID format");
      return;
    }

    const formData = new FormData();
    formData.append("id", messageId);
    formData.append("liked", newData[i].liked?.toString() || "");
    formData.append("disliked", newData[i].disliked?.toString() || "");
    formData.append("rating", newData[i].rating?.toString() || "");

    const upload = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/message`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error();
      return "Updated successfully";
    };

    const showToast = (promise: Promise<string>) => {
      toast.promise(promise, {
        loading: "Updating...",
        success: (msg) => {
          return msg;
        },
        error: "Error when updating",
      });
    };
    showToast(upload());
  };

  const handleKeyPressDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSendPrompt(e);
    }
  };

  const handleGetResponse = async () => {
    const start = performance.now();
    const res = await answerQuestions(prompt, data, isHydeChecked, isRerankingChecked, selectedModel);
    const end = performance.now();
    setResponseTime(Math.round(end - start));

    // If the response is null, return null
    if (!res)
      { console.log("No response received from the LLM API");
        return null;}

    const newResponse: MessageProps = {
      type: "response",
      message: res.answer,
      retrieved_docs: res.retrieved_docs || [],
    };
    console.log("Response received:", newResponse);
    return newResponse;
  };

  const handleSaveResponse = async (
    request: string,
    response: string,
    retrievedDoc: DocumentProps[] | undefined,
    chatBoxId: string
  ) => {
    if (!user?.id) {
      toast.error("User session is not ready. Cannot save response.");
      return null;
    }
    const formData = new FormData();
    formData.append("request", request);
    formData.append("userId", user?.id || "");
    formData.append("response", response);
    if (retrievedDoc) {
      // console.log("Retrieved Document IDs:", retrievedDoc);
      formData.append("retrievedDocIds", JSON.stringify(retrievedDoc));
    }
    formData.append("chatBoxId", chatBoxId);
    formData.append("responseTime", responseTime.toString());

    console.log("Sending message data to API:", {
      request: request.substring(0, 50) + "...",
      response: response.substring(0, 50) + "...",
      userId: user?.id,
      chatBoxId,
      responseTime,
      retrievedDocsCount: retrievedDoc?.length || 0
    });

    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/message`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      console.error("Error saving response:", {
        status: res.status,
        statusText: res.statusText,
        error: errorData
      });
      toast.error(`Error when saving the response: ${errorData.message || res.statusText}`);
      return null;
    }
    const data = await res.json();
    console.log("Message saved successfully with ID:", data.id);
    return data.id;
  };

  const handleNewChatBox = async (request: string, response: string, retrievedDocs: DocumentProps[]| undefined) => {
    const dynamicChatName = await getChatTitle(request);
    const formData = new FormData();

    formData.append("name", dynamicChatName);

    const res = await fetch('/api/chatbox', {
      method: "POST",
      body: formData,
    });

    if (!res.ok) toast.error("Error creating a new chat");
    else {
      const { id: chatId } = await res.json();
      triggerFunction();
      const messageId = await handleSaveResponse(request, response, retrievedDocs ,chatId);
      router.push(
        `/prompt/${chatId}?selected_model=${selectedModel}&hyde=${isHydeChecked}&reranking=${isRerankingChecked}&temperature=${temperatures}`
      );
      return messageId;
    }
  };

  const getChatTitle = async (request: string): Promise<string> => {
  try {
    // Get Clerk authentication token
    const token = await getToken();

    const res = await fetch(`/api/generate-title`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: request }),
    });

    if (!res.ok) {
      console.error('Generate title failed:', res.status, res.statusText);
      return request.substring(0, 30) + "..."; // Fallback
    }

    const { title } = await res.json();
    return title || request.substring(0, 30) + "..."; // Fallback

  } catch (error) {
    console.error("Failed to fetch chat title:", error);
    return request.substring(0, 30) + "..."; // Fallback
  }
};

const handleEvaluate = async (messageToEvaluate: MessageProps) => {
  console.log("Evaluating message:", messageToEvaluate);
  if (!messageToEvaluate || !messageToEvaluate.message_id) {
    toast.error("Message ID tidak ditemukan, tidak bisa evaluasi.");
    return;
  }

  // 1. Kumpulin semua data yang dibutuhkan
  // Cari pertanyaan yang relevan untuk jawaban ini
  const requestMessage = data.find((msg, index) => data[index + 1] === messageToEvaluate);
  
  if (!requestMessage) {
    toast.error("Pertanyaan asli tidak ditemukan.");
    return;
  }
  
  const payload = {
    messageId: messageToEvaluate.message_id,
    question: requestMessage.message,
    answer: messageToEvaluate.message,
    contexts: (messageToEvaluate.sourceDocs || []).map(doc => doc.content),
  };

  console.log("Mengirim data untuk evaluasi:", payload);
  setEvaluatingMessageId(messageToEvaluate.message_id);
  // 2. Tembak ke endpoint 'jembatan' di Next.js
  const promise = fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(res => {
    if (!res.ok) throw new Error("Gagal memulai evaluasi.");
    return "Evaluasi berhasil dijadwalkan!";
  }).catch((err) => {
      // Kalo gagal, matiin lagi saklarnya
      setEvaluatingMessageId(null);
      throw err; // Lempar errornya biar toast.promise nangkep
    });

  // 3. Tampilkan notifikasi ke user
  toast.promise(promise, {
    loading: "Memulai evaluasi...",
    success: () => {
      startPollingForScores(messageToEvaluate.message_id!);
      return "Evaluasi berhasil dijadwalkan!";
    },
    error: (err) => err.toString(),
  });
};

const startPollingForScores = (messageId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/message/status/${messageId}`);
        const data = await response.json();

        if (data.status === "complete") {
          console.log("Evaluasi selesai! Refreshing data...");
          clearInterval(intervalId); // <-- BERHENTI NANYA
          toast.success("Skor evaluasi berhasil diterima!");
          router.refresh(); // <-- REFRESH TAMPILAN
        } else {
          console.log("Status evaluasi masih 'pending', menunggu...");
        }
      } catch (error) {
        console.error("Gagal ngecek status, polling dihentikan.");
        clearInterval(intervalId);
      }
    }, 2000); // <-- Nanya setiap 2 detik

    // Buat pengaman, hentikan polling setelah 2 menit kalo gak ada hasil
    setTimeout(() => {
      clearInterval(intervalId);
      setEvaluatingMessageId(null);
      console.log("Polling dihentikan karena timeout.");
    }, 120000); // 2 menit
  };

const [selectedDoc, setSelectedDoc] = useState<DocumentProps | null>(null);
const [selectedScores, setSelectedScores] = useState<MessageProps | null>(null);
const [evaluatingMessageId, setEvaluatingMessageId] = useState<string | null>(null);
// console.log("PROPS 'conversations' YANG DITERIMA PROMPTPAGE:", conversations);
  return (
    <div className={`flex flex-col w-full h-full p-4 relative`}>
      <SessionDialog />
      <div className="flex w-full items-center gap-2 pb-4">
  {!isOpen && 
  <>
  {hasMounted && (
  <HoverCard openDelay={100} closeDelay={100}>
    <HoverCardTrigger asChild>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-fit p-2 rounded-xl border bg-white text-blue-700 hover:bg-white shadow-none hover:shadow-blue-200 hover:shadow dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
        <BsLayoutSidebarInset size={20}/>
      </Button>
    </HoverCardTrigger>
    <HoverCardContent className="p-1 bg-blue-700 text-white w-fit border-none shadow shadow-blue-700 dark:bg-gray-800 dark:text-gray-300" align="start" >
      <p className="text-xs">Open sidebar</p>
    </HoverCardContent>
  </HoverCard>
  )}
  {hasMounted && (
  <HoverCard openDelay={100} closeDelay={100}>
    <HoverCardTrigger asChild className="items-center justify-center">
      <Link href={"/prompt"} className="flex">
        <Button
          className="h-fit p-2 rounded-xl border bg-white text-blue-700 hover:bg-white shadow-none hover:shadow-blue-200 hover:shadow dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
          <BsPencilSquare size={20}/>
        </Button>
      </Link>
    </HoverCardTrigger>
    <HoverCardContent className="p-1 bg-blue-700 text-white w-fit border-none shadow shadow-blue-700 dark:bg-gray-800 dark:text-gray-300" align="start">
      <p className="text-xs">Create a new chat</p>
    </HoverCardContent>
  </HoverCard>
  )}
  </>
  }
  <ModelOptions
    selectedModel={selectedModel}
    setSelectedModel={setSelectedModel}
    isHydeChecked={isHydeChecked}
    isRerankingChecked={isRerankingChecked}
    isUltrathinkChecked={isUltrathinkChecked}
    setIsHydeChecked={setIsHydeChecked}
    setIsRerankingChecked={setIsRerankingChecked}
    setIsUltrathinkChecked={setIsUltrathinkChecked}
    temperatures={temperatures}
    setTemperature={setTemperature}
  />
  <Button
    onClick={() => window.location.href = "/notebook"}
    className="h-fit p-2 rounded-xl border bg-white text-blue-700 hover:bg-white shadow-none hover:shadow-blue-200 hover:shadow dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
  >
    Go to Notebook!
  </Button>
</div>
      {/* Dark Mode Toggle Button */}
      <button
         onClick={toggleTheme}
         className="fixed top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
         aria-label="Toggle Theme"
       >
 
         {theme === "light" ? <BsSun size={24} /> : <BsMoon size={24} />}
      </button>
      <div className="w-full flex-1 overflow-y-auto pt-2 mb-[60px] px-7">
        {data.length === 0 ? (
          <div className="flex flex-col justify-center m-auto h-full max-w-[900px]">
            <div className="bg-gradient-to-r from-blue-700 to-teal-300 bg-clip-text text-transparent animate-slide-in delay-300">
              <h1 className="md:text-6xl lg:text-7xl font-medium py-3">
                Welcome, {user && user.username}
              </h1>
            </div>
            <h1 className="md:text-6xl lg:text-7xl font-medium py-3 bg-gradient-to-r from-neutral-500 to-sky-700 bg-clip-text text-transparent animate-slide-in delay-300">
              Ready to learn something new?
            </h1>
          </div>
        ) : (
          <div className="flex flex-col m-auto max-w-[900px]">
            {data.map((item, i) => (
              <ChatBox
                key={item.message_id || `msg-${i}`}
                variant={item.type}
                message={item.message}
                thinking={item.thinking} // Add thinking prop
                sourceDocs={item.sourceDocs}
                id={i}
                user={user}
                liked={item.liked}
                disliked={item.disliked}
                rating={item.rating}
                handleLike={() => handleLike(i)}
                handleDislike={() => handleDislike(i)}
                handleRating={(value) => handleRating(value, i)}
                handleUpdateMisc={() => handleUpdateMisc(i)}
                handleEvaluate={() => handleEvaluate(item)}
                onSourceClick={(doc) => setSelectedDoc(doc)}
                onShowScores={() => setSelectedScores(item)}
                faithfulness={item.faithfulness}
                // answer_relevancy={item.answer_relevancy}
                // context_precision={item.context_precision}
                // context_relevance={item.context_relevance}
                isEvaluating={evaluatingMessageId === item.message_id}
              />
            ))}
            {isLoading && (
              <div className="flex flex-col w-full text-sm justify-start animate-pulse gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full h-7 w-7 bg-slate-200"></div>
                  <div className="w-24 rounded-xl h-7 bg-slate-200"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-3/5 rounded-xl h-3 bg-slate-200"></div>
                  <div className="flex-1 rounded-xl h-3 bg-slate-200"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/5 rounded-xl h-3 bg-slate-200"></div>
                  <div className="flex-1 rounded-xl h-3 bg-slate-200"></div>
                </div>
                <div className="w-48 rounded-xl h-5 bg-slate-200"></div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="absolute bottom-0 right-0 left-0 m-auto w-full flex justify-center items-center px-4 py-3 z-40 bg-white dark:bg-[hsl(var(--background))] overflow-hidden">
  <form
    action="submit"
    onSubmit={handleSendPrompt}
    onKeyDown={handleKeyPressDown}
    className="flex w-full max-w-[900px] items-center gap-x-4 m-auto"
  >
    <div
      className="flex flex-col items-center justify-center w-full min-h-12 max-h-24 bg-slate-100 dark:bg-gray-700 px-5 py-2 overflow-y-auto rounded-xl"
    >
      <div
        ref={divRef}
        contentEditable={!isLoading && !!user}
        className="w-full h-fit bg-transparent outline-none whitespace-pre-line text-gray-800 dark:text-white"
        role="textbox"
        onInput={(e) => setPrompt(e.currentTarget.textContent || "")}
        onFocus={() => setIsPrompting(true)}
        onBlur={() => setIsPrompting(false)}
        aria-multiline="true"
      ></div>
    </div>
    <Button disabled={prompt.length === 0 || isLoading || !user} className="bg-blue-700 hover:bg-blue-500">
      <LuSendHorizontal size={20} />
    </Button>
  </form>
</div>
 <SourceDetailModal 
        doc={selectedDoc} 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
      />
      <EvalResultModal 
        scores={selectedScores} 
        isOpen={!!selectedScores} 
        onClose={() => setSelectedScores(null)} 
      />
    </div>
  );
};

export default PromptPage;