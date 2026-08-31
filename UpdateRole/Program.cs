using System;
using Microsoft.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connectionString = "Server=(localdb)\\mssqllocaldb;Database=WorkFlowTaskDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
        using (SqlConnection conn = new SqlConnection(connectionString))
        {
            conn.Open();
            using (SqlCommand cmd = new SqlCommand("UPDATE Users SET Role = 'Administrator' WHERE Email = 'admin@workflow.com'", conn))
            {
                int rows = cmd.ExecuteNonQuery();
                Console.WriteLine($"Updated {rows} rows.");
            }
        }
    }
}
