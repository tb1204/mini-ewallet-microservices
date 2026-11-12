package com.example.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "notification.exchange";

    // Queues
    public static final String OTP_EMAIL_QUEUE = "notification.email.otp.queue";
    public static final String TX_OTP_EMAIL_QUEUE = "notification.email.tx-otp.queue";
    public static final String TRANSACTION_QUEUE = "notification.transaction.queue";

    // Routing keys
    public static final String OTP_EMAIL_ROUTING_KEY = "notification.email.otp";
    public static final String TX_OTP_EMAIL_ROUTING_KEY = "notification.email.tx-otp";
    public static final String TRANSACTION_ROUTING_KEY = "notification.transaction";

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue otpEmailQueue() {
        return QueueBuilder.durable(OTP_EMAIL_QUEUE).build();
    }

    @Bean
    public Queue txOtpEmailQueue() {
        return QueueBuilder.durable(TX_OTP_EMAIL_QUEUE).build();
    }

    @Bean
    public Queue transactionQueue() {
        return QueueBuilder.durable(TRANSACTION_QUEUE).build();
    }

    @Bean
    public Binding otpEmailBinding(Queue otpEmailQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(otpEmailQueue).to(notificationExchange).with(OTP_EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding txOtpEmailBinding(Queue txOtpEmailQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(txOtpEmailQueue).to(notificationExchange).with(TX_OTP_EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding transactionBinding(Queue transactionQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(transactionQueue).to(notificationExchange).with(TRANSACTION_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}

