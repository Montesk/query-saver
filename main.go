package main

import (
	"html/template"
	"log"
	"net/http"
	"path/filepath"
)

func mainPage(w http.ResponseWriter, r *http.Request) {
	templatePath := filepath.Join("templates", "index.html")

	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		log.Fatalf("error parsing html file %v err: %v", templatePath, err)
	}

	err = tmpl.Execute(w, nil)
	if err != nil {
		log.Fatalf("error executing html file %v err: %v", templatePath, err)
	}
}

func subPage(w http.ResponseWriter, r *http.Request) {
	templatePath := filepath.Join("templates", "page.html")

	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		log.Fatalf("error parsing html file %v err: %v", templatePath, err)
	}

	err = tmpl.Execute(w, nil)
	if err != nil {
		log.Fatalf("error executing html file %v err: %v", templatePath, err)
	}
}

func main() {
	http.HandleFunc("/", mainPage)
	http.HandleFunc("/page/", subPage)

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.ListenAndServe(":3005", nil)
}
