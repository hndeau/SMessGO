package main

import (
	"log"
	"net/http"
	"path/filepath"
	"runtime"
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
		http.ServeFile(w, r, filepath.Join(currentDir, "html/chat.html")) // Assuming the HTML file is named "index.html"
	})

	// Add the /cognito handler
	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		cognitoURL := "https://smessauth.auth.us-east-1.amazoncognito.com/signup?client_id=34mgjfocrlfp3c4ij35qoe8d4b&response_type=token&scope=email+openid+phone&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback"
		http.Redirect(w, r, cognitoURL, http.StatusFound)
	})

	http.ListenAndServe("80", nil)

	log.Fatal(http.ListenAndServe(":80", nil))
}
