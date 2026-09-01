using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using Backend.Controllers;

namespace Backend.Tests.Controllers
{
    public class HealthControllerTests
    {
        [Fact]
        public void Get_ReturnsOkResultWithStatus()
        {
            // Arrange
            var controller = new HealthController();

            // Act
            var result = controller.GetHealth();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Should contain a status property
            var value = okResult.Value;
            var statusProp = value.GetType().GetProperty("status");
            Assert.NotNull(statusProp);
            
            var statusValue = statusProp.GetValue(value) as string;
            Assert.Equal("Healthy", statusValue);
        }
    }
}
