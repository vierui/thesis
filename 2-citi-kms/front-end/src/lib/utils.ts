import { MessageProps } from "@/types";

// Re-export cn from the separate file to maintain compatibility
export { cn } from "./cn";

export function parseDate(date: string) {
  return new Date(date);
}

export function generateDashboardDocumentsLink(
  type: string,
  userId: string,
  paginationIndex: number,
  rowsPerPage: number,
  searchTerm: string | null = null,
  tags: string[] | null = null
): string {
  const tagsStr = tags
    ? tags
        .map((item) => {
          return `&tag=${item}`;
        })
        .join("")
    : "";

  const searchStr = searchTerm ? `&searchTerm=${searchTerm}` : "";

  if (type === "client") {
    const link = `?page=${paginationIndex}&n=${rowsPerPage}${tagsStr}${searchStr}`;
    return link;
  }

  return `/api/documents?id=${userId}&skip=${paginationIndex}&take=${rowsPerPage}${tagsStr}${searchStr}`;
}

export const answerQuestions = async (
  prompt: string,
  history: MessageProps[] | null | undefined,
  hyde: boolean,
  reranking: boolean,
  selectedModel: string
) => {
  const formData = new FormData();
  formData.append("question", prompt);
  formData.append("conversation_history", JSON.stringify(history));
  formData.append("hyde", hyde.toString());
  formData.append("reranking", reranking.toString());
  formData.append("selected_model", selectedModel);

  // console.log(history);
  console.log("Sending request to the API with prompt:", prompt);
  const response = await fetch("/api/prompt", {
    method: "POST",
    body: formData,
  });
  if (!response.ok){
    console.log("Error fetching record123");
    return null;}
    else {
      // console.log("Response:", response);
      console.log("Response successfully1214213123131312x312x31231x3123");
      
  }
  const data = await response.json();

  const { message } = data;
  console.log("Received message:", message);
  if (!message) {
    console.error("No message returned from the API");
    // return null;
  }
  return message;
};

export const getChatMessages = async (id: string, token: string | null) => {
  if (!token) {
    // Fail fast kalo gak ada token
    throw new Error("Authentication token is missing.");
  }

  try {
    // Use absolute URL for server-side fetch, relative URL for client-side
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
      : '';

    const response = await fetch(`${baseUrl}/api/chatbox/${id}`, {
      credentials: 'include',
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // console.log("Data:", data);
    return sortMessageProps(data);
  } catch (error) {
    //console.error("error utils");
    console.error("Failed to fetch chat messages:", error);
    return null; // or handle error as needed
  }
};

function sortMessageProps(response: any) {
  const data = response.data;
  const messages = [] as MessageProps[];

  if (!data) {
    return messages;
  }

  for (let i = 0; i < data.length; i++) {
    messages.push({
      type: "request",
      message: data[i].request,
    });
    messages.push({
      type: "response",
      message_id: data[i].id,
      message: data[i].response,
      liked: data[i].liked,
      disliked: data[i].disliked,
      rating: data[i].rating,
      sourceDocs: data[i].sourceDocs,
      faithfulness: data[i].faithfulness,
      answer_relevancy: data[i].answer_relevancy,
      context_precision: data[i].context_precision,
      context_relevance: data[i].context_relevance,
    });
  }
  return messages;
}

export const updateDocumentMetadata = async (
  documentId: string,
  title: string,
  topic: string,
  isPublic: Boolean,
  change: Boolean
) => {
  // console.log(documentId, title, topic, isPublic, change);
  const formData = new FormData();
  formData.append("id", documentId);
  formData.append("title", title);
  formData.append("topic", topic);
  change
    ? formData.append(
        "public",
        isPublic !== null ? (!isPublic).toString() : "public"
      )
    : formData.append(
        "public",
        isPublic !== null ? isPublic.toString() : "private"
      );

  const res = await fetch("/api/document", {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) {
    return "Error during updating records!";
  }
};

export const deleteDocumentFromVDB = async (
  documentId: string,
  collectionName: string
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_LLM_SERVER_URL}/document/delete?document_id=${documentId}&collection_name=${collectionName}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return "Error during deleting document from VDB!";
  }
};

export const insertDocumentToVDB = async (
  documentId: string,
  userId: string | null | undefined,
  tag: string,
  collectionName: string,
  change?: Boolean
) => {
  const body = {
    document_id: documentId,
    user_id: userId,
    tag: tag,
    collection_name: collectionName,
    change: change,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_LLM_SERVER_URL}/document/insert`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    return "Error during inserting document to VDB!";
  }
};

export const deleteDocument = async (
  documentId: string | undefined,
  userId: string | undefined
) => {
  const res = await fetch(
    `/api/document?id=${documentId}&user_id=${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    return "Error during deleting document!";
  }
};
