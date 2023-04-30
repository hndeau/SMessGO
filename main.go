package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"runtime"
	"strings"
)

type SummarizePayload struct {
	Text string `json:"text"`
}

type OpenAIPayload struct {
	Prompt string `json:"prompt"`
}

type OpenAIResponse struct {
	Choices []struct {
		Text string `json:"text"`
	} `json:"choices"`
}

func serveStaticFile(currentDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(currentDir, r.URL.Path[1:])
		http.ServeFile(w, r, path)
	})
}

func main() {

	// Get the current file's path
	_, currentFilePath, _, _ := runtime.Caller(0)

	// Get the directory of the current file
	currentDir := filepath.Dir(currentFilePath)

	// Serve static files
	http.Handle("/js/", serveStaticFile(currentDir))
	http.Handle("/css/", serveStaticFile(currentDir))
	http.Handle("/html/", serveStaticFile(currentDir))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(currentDir, "html/landingpage.html")) // Assuming the HTML file is named "index.html"
	})

	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(currentDir, "html/login.html")) // Assuming the HTML file is named "index.html"
	})

	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(currentDir, "html/callback.html")) // Assuming the HTML file is named "index.html"
	})

	http.HandleFunc("/chat", func(w http.ResponseWriter, r *http.Request) {
		// Parse the URL parameters
		params := r.URL.Query()
		username := params.Get("user")
		// Load the HTML file
		htmlFile := filepath.Join(currentDir, "html/chat.html")
		htmlData, err := ioutil.ReadFile(htmlFile)
		if err != nil {
			http.Error(w, "Error reading HTML file", http.StatusInternalServerError)
			return
		}

		// Replace the username placeholder with the provided value (if any)
		if username != "" {
			htmlString := string(htmlData)
			htmlString = strings.Replace(htmlString, "John", fmt.Sprintf("%s", username), 1)
			htmlData = []byte(htmlString)
		}

		// Serve the modified HTML file
		w.Header().Set("Content-Type", "text/html")
		w.Write(htmlData)
	})

	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(currentDir, "html/signup.html")) // Assuming the HTML file is named "index.html"
	})

	http.HandleFunc("/summarize", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid method", http.StatusBadRequest)
			return
		}

		var payload SummarizePayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		summary, err := getSummaryFromOpenAI(payload.Text)
		if err != nil {
			http.Error(w, "Failed to get summary", http.StatusInternalServerError)
			return
		}

		fmt.Fprint(w, summary)
	})

	http.ListenAndServe("80", nil)

	log.Fatal(http.ListenAndServe(":80", nil))
}

func getSummaryFromOpenAI(text string) (string, error) {
	apiKey := "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"
	openAIURL := "https://api.openai.com/v1/engines/davinci-codex/completions"

	payload := OpenAIPayload{
		Prompt: fmt.Sprintf("Please summarize the following conversation:\n\n%s", text),
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, openAIURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var openAIResponse OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResponse); err != nil {
		return "", err
	}

	if len(openAIResponse.Choices) == 0 {
		return "", fmt.Errorf("no summary provided")
	}

	return openAIResponse.Choices[0].Text, nil
}
