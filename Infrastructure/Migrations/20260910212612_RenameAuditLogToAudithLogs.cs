using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameAuditLogToAudithLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Users_UserId",
                table: "AuditLogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AuditLogs",
                table: "AuditLogs");

            migrationBuilder.RenameTable(
                name: "AuditLogs",
                newName: "AudithLogs");

            migrationBuilder.RenameIndex(
                name: "IX_AuditLogs_UserId",
                table: "AudithLogs",
                newName: "IX_AudithLogs_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AuditLogs_Entity_EntityId",
                table: "AudithLogs",
                newName: "IX_AudithLogs_Entity_EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_AuditLogs_Date",
                table: "AudithLogs",
                newName: "IX_AudithLogs_Date");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AudithLogs",
                table: "AudithLogs",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AudithLogs_Users_UserId",
                table: "AudithLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AudithLogs_Users_UserId",
                table: "AudithLogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AudithLogs",
                table: "AudithLogs");

            migrationBuilder.RenameTable(
                name: "AudithLogs",
                newName: "AuditLogs");

            migrationBuilder.RenameIndex(
                name: "IX_AudithLogs_UserId",
                table: "AuditLogs",
                newName: "IX_AuditLogs_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AudithLogs_Entity_EntityId",
                table: "AuditLogs",
                newName: "IX_AuditLogs_Entity_EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_AudithLogs_Date",
                table: "AuditLogs",
                newName: "IX_AuditLogs_Date");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AuditLogs",
                table: "AuditLogs",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Users_UserId",
                table: "AuditLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
