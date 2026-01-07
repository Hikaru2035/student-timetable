pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/home/dev/todo-api"
        ENV_FILE   = ".env"
        BACKUP_ENV = ".env.backup"
        VERSION    = ''
    }

    stages {

        stage('Setup Node & VERSION') {
            steps {
                echo "⚡ Setup Node.js"
                sh '''
                    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                    apt-get install -y nodejs
                    node -v
                    npm -v
                '''

                echo "🔖 Set VERSION from git commit"
                sh '''
                    VERSION=$(git rev-parse --short HEAD)
                    echo "VERSION=$VERSION" > version.env
                '''
                script {
                    def props = readProperties file: 'version.env'
                    env.VERSION = props['VERSION']
                    echo "✅ VERSION=${env.VERSION}"
                }
            }
        }

        stage('Install Backend & Frontend') {
            steps {
                echo "📦 Install backend deps"
                sh '''
                    cd backend
                    npm ci
                '''

                echo "📦 Install frontend deps & build"
                sh '''
                    cd frontend
                    npm ci
                    npm run build
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', 
                                                 usernameVariable: 'DOCKER_USERNAME', 
                                                 passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh '''
                        echo "🐳 Docker login"
                        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

                        echo "🛠️ Build Docker images"
                        docker compose -f docker-compose.ci.yaml build --build-arg VERSION=$VERSION

                        echo "⬆️ Push Docker images"
                        docker compose -f docker-compose.ci.yaml push
                    '''
                }
            }
        }

        stage('Pre-check') {
            steps {
                sh '''
                    cd $DEPLOY_DIR
                    echo "📌 Backup current env"
                    if [ -f $ENV_FILE ]; then
                        cp $ENV_FILE $BACKUP_ENV
                    fi
                '''
            }
        }

        stage('Deploy New Version') {
            steps {
                sh '''
                    cd $DEPLOY_DIR
                    echo "VERSION=${VERSION}" > $ENV_FILE
                    echo "🚀 Pull & start new version"
                    docker-compose --env-file $ENV_FILE -f docker-compose.prod.yaml pull
                    docker-compose --env-file $ENV_FILE -f docker-compose.prod.yaml up -d
                '''
            }
        }

        stage('Rollback') {
            when {
                expression { currentBuild.result == 'FAILURE' }
            }
            steps {
                sh '''
                    cd $DEPLOY_DIR
                    echo "🧯 ROLLBACK STARTED"
                    if [ -f $BACKUP_ENV ]; then
                        cp $BACKUP_ENV $ENV_FILE
                        docker-compose --env-file $ENV_FILE -f docker-compose.prod.yaml up -d
                        echo "♻️ Rollback completed"
                    else
                        echo "⚠️ No backup version found"
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo "✅ DEPLOY SUCCESS – PROD STABLE"
        }
        failure {
            echo "❌ DEPLOY FAILED"
        }
    }
}
