using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Backend.Tests.Services
{
    public class JwtTokenServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;

        public JwtTokenServiceTests()
        {
            _configurationMock = new Mock<IConfiguration>();
        }

        private JwtTokenService CreateService(Dictionary<string, string?> configValues = null)
        {
            configValues ??= new Dictionary<string, string?>
            {
                { "Jwt:Key", "super-secret-key-that-is-very-long-and-secure" },
                { "Jwt:Issuer", "TestIssuer" },
                { "Jwt:Audience", "TestAudience" },
                { "Jwt:ExpirationMinutes", "60" }
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configValues)
                .Build();

            return new JwtTokenService(configuration);
        }

        [Fact]
        public void GenerateToken_ValidUser_GeneratesValidJwtWithCorrectClaims()
        {
            // Arrange
            var service = CreateService();
            var user = new User { Id = "123", Email = "test@test.com", Name = "Test User", Role = "Administrator" };

            // Act
            var (token, expiresAt) = service.GenerateToken(user);

            // Assert
            Assert.False(string.IsNullOrWhiteSpace(token));
            Assert.True(expiresAt > DateTimeOffset.UtcNow);

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            Assert.Equal("TestIssuer", jwtToken.Issuer);
            Assert.Contains("TestAudience", jwtToken.Audiences);

            var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var customRoleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

            Assert.Equal("123", idClaim);
            Assert.Equal("test@test.com", emailClaim);
            Assert.Equal("Test User", nameClaim);
            Assert.Equal("Administrator", roleClaim);
            Assert.Equal("Administrator", customRoleClaim);
            
            Assert.True(jwtToken.ValidTo > DateTime.UtcNow);
            Assert.True(jwtToken.ValidTo <= DateTime.UtcNow.AddMinutes(61)); // Allow 1 minute skew
        }

        [Fact]
        public void GenerateToken_NullUser_ThrowsArgumentNullException()
        {
            // Arrange
            var service = CreateService();

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => service.GenerateToken(null));
        }

        [Theory]
        [InlineData("", "test@test.com", "Test User", "Administrator")]
        [InlineData(null, "test@test.com", "Test User", "Administrator")]
        [InlineData("123", "", "Test User", "Administrator")]
        [InlineData("123", null, "Test User", "Administrator")]
        [InlineData("123", "test@test.com", "", "Administrator")]
        [InlineData("123", "test@test.com", null, "Administrator")]
        [InlineData("123", "test@test.com", "Test User", "")]
        [InlineData("123", "test@test.com", "Test User", null)]
        public void GenerateToken_MissingUserDetails_ThrowsArgumentException(string id, string email, string name, string role)
        {
            // Arrange
            var service = CreateService();
            var user = new User { Id = id, Email = email, Name = name, Role = role };

            // Act & Assert
            Assert.Throws<ArgumentException>(() => service.GenerateToken(user));
        }

        [Fact]
        public void GenerateToken_MissingJwtKey_ThrowsInvalidOperationException()
        {
            // Arrange
            var configValues = new Dictionary<string, string>(); // No Jwt:Key
            var service = CreateService(configValues);
            var user = new User { Id = "123", Email = "test@test.com", Name = "Test User", Role = "Administrator" };
            
            // Unset environment variable temporarily if it exists
            var oldEnv = Environment.GetEnvironmentVariable("JWT_KEY");
            Environment.SetEnvironmentVariable("JWT_KEY", null);

            try
            {
                // Act & Assert
                Assert.Throws<InvalidOperationException>(() => service.GenerateToken(user));
            }
            finally
            {
                // Restore environment variable
                Environment.SetEnvironmentVariable("JWT_KEY", oldEnv);
            }
        }
    }
}
