#Build ma nguon thanh file .jar
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

#copy maven wrapper va pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

#cap quyen thuc thi cho mvnw va tai dependencies
#RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

#copy src va build ra file jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

#Chay ung dung
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

#Chi copy file jar da build
COPY --from=builder /app/target/*.jar apigateway.jar

#Khai bao cong service
EXPOSE 8080

#Lenh chay ung dung khi container bat len
ENTRYPOINT ["java", "-jar", "apigateway.jar"]