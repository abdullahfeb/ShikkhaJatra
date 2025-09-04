const { google } = require('googleapis');

class GoogleFormsService {
    constructor() {
        this.forms = google.forms('v1');
        this.auth = null;
    }

    async authenticate(credentials) {
        try {
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/forms']
            });
            
            const authClient = await this.auth.getClient();
            google.options({ auth: authClient });
            
            return true;
        } catch (error) {
            console.error('Google Forms authentication error:', error);
            throw error;
        }
    }

    async createForm(title, description) {
        try {
            const form = await this.forms.forms.create({
                requestBody: {
                    info: {
                        title,
                        documentTitle: title,
                        description
                    }
                }
            });
            
            return form.data;
        } catch (error) {
            console.error('Error creating form:', error);
            throw error;
        }
    }

    async addQuestion(formId, questionData) {
        try {
            const request = {
                formId,
                requestBody: {
                    createItem: {
                        item: {
                            title: questionData.question,
                            questionItem: {
                                question: {
                                    choiceQuestion: {
                                        type: 'RADIO',
                                        options: questionData.options.map(option => ({
                                            value: option
                                        })),
                                        shuffle: true
                                    }
                                }
                            }
                        }
                    }
                }
            };
            
            const response = await this.forms.forms.batchUpdate(request);
            return response.data;
        } catch (error) {
            console.error('Error adding question:', error);
            throw error);
        }
    }

    async getFormResponses(formId) {
        try {
            const responses = await this.forms.forms.responses.list({
                formId
            });
            
            return responses.data;
        } catch (error) {
            console.error('Error getting form responses:', error);
            throw error;
        }
    }

    async convertFormToQuiz(formId) {
        try {
            const form = await this.forms.forms.get({ formId });
            const questions = [];
            
            if (form.data.items) {
            for (const item of form.data.items) {
                if (item.questionItem && item.questionItem.question.choiceQuestion) {
                    const question = {
                        question: item.title,
                        options: item.questionItem.question.choiceQuestion.options.map(opt => opt.value),
                        correctAnswer: 0,
                        points: 1
                    };
                    questions.push(question);
                }
            }
            }
            
            return {
                title: form.data.info.title,
                description: form.data.info.description,
                questions
            };
        } catch (error) {
            console.error('Error converting form to quiz:', error);
            throw error;
        }
    }
}

module.exports = new GoogleFormsService();
