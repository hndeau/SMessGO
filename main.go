package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"runtime"
	"strings"
)

func serveStaticFile(currentDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(currentDir, r.URL.Path[1:])
		http.ServeFile(w, r, path)
	})
}

type outgoing struct {
	ConversationID string `json:"conversation_id"`
	Message        string `json:"message"`
}

type incoming struct {
	ConversationID string `json:"conversation_id"`
	Timestamp      int    `json:"timestamp"`
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

	http.ListenAndServe("80", nil)

	log.Fatal(http.ListenAndServe(":80", nil))
}
