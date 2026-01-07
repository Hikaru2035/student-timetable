pipeline {
  agent any

  parameters {
    string(
      name: 'VERSION',
      description: 'Docker image tag (commit SHA)',
      trim: true
    )
  }

  environment {
    DEPLOY_DIR = '/home/dev/todo-api'
  }

  stages {

    stage('Validate') {
      steps {
        script {
          if (!params.VERSION?.trim()) {
            error "❌ VERSION is required"
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        sh """
          echo "🚀 Deploying version: ${params.VERSION}"

          cd ${DEPLOY_DIR}

          export VERSION=${params.VERSION}

          docker compose -f docker-compose.prod.yaml pull
          docker compose -f docker-compose.prod.yaml up -d
        """
      }
    }
  }

  post {
    success {
      echo "✅ Deploy SUCCESS: ${params.VERSION}"
    }
    failure {
      echo "❌ Deploy FAILED"
    }
  }
}
